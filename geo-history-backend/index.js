const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const moment = require('moment-timezone');

const app = express();  // Initialize the Express application
const baseDir = path.join('C:', 'Users', 'Brad', 'Documents', 'Takeout', 'Location History (Timeline)', 'Semantic Location History'); // Specify base directory for JSON files

// Use CORS middleware
app.use(cors());

// Use JSON parsing middleware
app.use(express.json());

// Endpoint to get available years
app.get('/api/years', (req, res) => {
    fs.readdir(baseDir, (err, files) => {
        if (err) {
            console.error('Error reading base directory:', err); // Log the exact error
            return res.status(500).json({ error: 'Error reading base directory' });
        }

        const years = files.filter(file => /^[0-9]{4}$/.test(file)); // Filter to only include folders with 4-digit year names
        res.json(years);
    });
});

// Endpoint to get available months for a specific year
app.get('/api/months/:year', (req, res) => {
    const { year } = req.params;
    const yearDir = path.join(baseDir, year);

    fs.readdir(yearDir, (err, files) => {
        if (err) {
            console.error('Error reading year directory:', err); // Log the exact error
            return res.status(500).json({ error: 'Error reading year directory' });
        }

        const months = files
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace(`${year}_`, '').replace('.json', '')); // Remove year prefix and file extension
        res.json(months);
    });
});

app.post('/api/timezone', (req, res) => {
    const locations = req.body.locations;  // Expecting an array of latitude and longitude objects

    if (!Array.isArray(locations) || locations.length === 0) {
        console.error('Missing or invalid locations array');
        return res.status(400).json({ error: 'Missing or invalid locations array' });
    }

    // Write the data to a temporary file
    const tmpFilePath = './temp_locations.json';  // Temporary file to hold the JSON data
    fs.writeFileSync(tmpFilePath, JSON.stringify(locations, null, 2)); // Pretty-print for easier debugging
    
    // Add log to verify the content of the file
    const writtenData = fs.readFileSync(tmpFilePath, 'utf8');
    // console.log('Data written to temp file:', writtenData);
    
    const command = `python get_timezone.py ${tmpFilePath}`;
    console.log('Executing command:', command);  // Log the command

    exec(command, (error, stdout, stderr) => {
        // Clean up the temporary file
        if (fs.existsSync(tmpFilePath)) {
            try {
                fs.unlinkSync(tmpFilePath);
            } catch (error) {
                console.error(`Error deleting temp_locations.json: ${error.message}`);
            }
        } else {
            console.warn('temp_locations.json not found; skipping deletion.');
        }

        if (error) {
            console.error(`Error executing Python script: ${stderr}`);
            return res.status(500).json({ error: 'Error calculating timezones' });
        }
        try {
            const output = JSON.parse(stdout);
            if (output.error) {
                console.error(`Error from Python script: ${output.error}`);
                return res.status(500).json({ error: 'Error calculating timezones' });
            }
            res.json(output);
        } catch (parseError) {
            console.error(`Error parsing Python script output: ${stdout}, error: ${parseError.message}`);
            res.status(500).json({ error: 'Error calculating timezones' });
        }
    });
});

// Helper function to read and filter JSON data for the entire month
function getHappeningsForMonth(year, month) {
    return new Promise((resolve, reject) => {
        const monthFileName = `${year}_${month.toUpperCase()}.json`;
        const filePath = path.join(baseDir, year.toString(), monthFileName);
        console.log(`Attempting to read file: ${filePath}`);

        // Read the JSON file
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // Suppress file not found error for missing adjacent months
                    console.warn(`File not found: ${filePath}. This may be expected for adjacent months.`);
                    return resolve([]);
                } else {
                    console.error(`Error reading file: ${filePath}, error: ${err.message}`);
                    return reject(`Error reading file: ${filePath}, error: ${err.message}`);
                }
            }

            try {
                const locationData = JSON.parse(data);
                const happenings = [];

                // Iterate over the timeline objects
                locationData.timelineObjects.forEach(obj => {
                    if (obj.activitySegment || obj.placeVisit) {
                        happenings.push(obj);
                    }
                });

                resolve(happenings);
            } catch (parseError) {
                console.error(`Error parsing JSON data from file: ${filePath}, error: ${parseError.message}`);
                reject(`Error parsing JSON data from file: ${filePath}, error: ${parseError.message}`);
            }
        });
    });
}

// Helper function to get happenings from previous or next month
async function getAdjacentMonthHappenings(year, month, dayType) {
    const currentMonth = moment(`${year}-${month}`, 'YYYY-MMMM');
    let adjacentMonth;

    if (dayType === 'previous') {
        adjacentMonth = currentMonth.clone().subtract(1, 'months');
    } else if (dayType === 'next') {
        adjacentMonth = currentMonth.clone().add(1, 'months');
    } else {
        return [];
    }

    const adjacentYear = adjacentMonth.format('YYYY');
    const adjacentMonthName = adjacentMonth.format('MMMM').toUpperCase();

    try {
        const happenings = await getHappeningsForMonth(adjacentYear, adjacentMonthName);

        if (dayType === 'previous') {
            // Filter to include only the last day of the month
            return happenings.filter(happening => {
                let startTimestamp = happening.activitySegment?.duration?.startTimestamp || happening.placeVisit?.duration?.startTimestamp;
                return moment.utc(startTimestamp).date() === adjacentMonth.daysInMonth();
            });
        } else if (dayType === 'next') {
            // Filter to include only the first day of the month
            return happenings.filter(happening => {
                let startTimestamp = happening.activitySegment?.duration?.startTimestamp || happening.placeVisit?.duration?.startTimestamp;
                return moment.utc(startTimestamp).date() === 1;
            });
        }
    } catch (error) {
        console.warn(`Error fetching happenings for ${dayType} month: ${error}`);
        return [];
    }
}

// Endpoint to get happenings for a specific month
app.get('/api/happenings', async (req, res) => {
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).send('Missing year or month parameters');
    }

    try {
        // Fetch happenings for the current month
        let happenings = await getHappeningsForMonth(year, month);

        // Fetch happenings from the previous and next months
        const previousMonthHappenings = await getAdjacentMonthHappenings(year, month, 'previous');
        const nextMonthHappenings = await getAdjacentMonthHappenings(year, month, 'next');

        // Combine happenings from previous, current, and next months
        happenings = [...previousMonthHappenings, ...happenings, ...nextMonthHappenings];
        
        // Extract unique locations from the happenings
        const locations = [];
        happenings.forEach(happening => {
            if (happening.activitySegment) {
                const { latitudeE7, longitudeE7 } = happening.activitySegment.startLocation;
                locations.push({ latitude: latitudeE7 / 1e7, longitude: longitudeE7 / 1e7 });
            } else if (happening.placeVisit) {
                const { latitudeE7, longitudeE7 } = happening.placeVisit.location;
                locations.push({ latitude: latitudeE7 / 1e7, longitude: longitudeE7 / 1e7 });
            }
        });

        // Fetch timezones in bulk
        const timezonesResponse = await fetchTimezones(locations);
        if (timezonesResponse.error) {
            console.error(`Error fetching timezones: ${timezonesResponse.error}`);
            return res.status(500).json({ error: 'Error calculating timezones' });
        }

        // Attach timezones to each happening
        happenings = happenings.map((happening, index) => {
            if (happening.activitySegment) {
                happening.activitySegment.startLocationTimezone = timezonesResponse[index].timezone;
            } else if (happening.placeVisit) {
                happening.placeVisit.locationTimezone = timezonesResponse[index].timezone;
            }
            return happening;
        });

        // Split happenings into days based on their local start time, and filter to only include days in the current month
        const happeningsByDay = {};
        happenings.forEach(happening => {
            let startTimestamp;
            let timezone;

            if (happening.activitySegment) {
                startTimestamp = happening.activitySegment.duration.startTimestamp;
                timezone = happening.activitySegment.startLocationTimezone;
            } else if (happening.placeVisit) {
                startTimestamp = happening.placeVisit.duration.startTimestamp;
                timezone = happening.placeVisit.locationTimezone;
            }

            if (startTimestamp && timezone) {
                const happeningMoment = moment.tz(startTimestamp, timezone);
                if (happeningMoment.month() === moment(`${year}-${month}`, 'YYYY-MMMM').month()) {
                    const dayKey = happeningMoment.format('YYYY-MM-DD');

                    if (!happeningsByDay[dayKey]) {
                        happeningsByDay[dayKey] = [];
                    }
                    happeningsByDay[dayKey].push(happening);
                }
            }
        });

        res.json(happeningsByDay);
    } catch (error) {
        console.error(`Error processing /api/happenings request: ${error}`);
        res.status(500).send(error);
    }
});

// Helper function to fetch timezones using Python script
const fetchTimezones = async (locations) => {
    return new Promise((resolve, reject) => {
        const tmpFilePath = './temp_locations.json';
        fs.writeFileSync(tmpFilePath, JSON.stringify(locations, null, 2));

        const command = `python get_timezone.py ${tmpFilePath}`;
        console.log('Executing command:', command);

        exec(command, (error, stdout, stderr) => {
            if (fs.existsSync(tmpFilePath)) {
                try {
                    fs.unlinkSync(tmpFilePath);
                } catch (error) {
                    console.error(`Error deleting temp_locations.json: ${error.message}`);
                }
            } else {
                console.warn('temp_locations.json not found; skipping deletion.');
            }
            if (error) {
                console.error(`Error executing Python script: ${stderr}`);
                return reject({ error: 'Error calculating timezones' });
            }

            try {
                const output = JSON.parse(stdout);
                if (output.error) {
                    return reject({ error: output.error });
                }
                resolve(output);
            } catch (parseError) {
                console.error(`Error parsing Python output: ${parseError.message}`);
                reject({ error: 'Error parsing Python script output' });
            }
        });
    });
};

// Start the server
app.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
});
