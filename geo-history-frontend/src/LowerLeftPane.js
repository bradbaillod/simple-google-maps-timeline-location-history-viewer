import React, { useState, useEffect, useContext } from 'react';
import './LowerLeftPane.css';
import moment from 'moment-timezone';
import { AppContext } from './HoverContext';

function LowerLeftPane() {
    const { happenings, setHappenings, selectedYear, selectedMonth, selectedDay, setHoveredHappening } = useContext(AppContext);
    const [sortedHappenings, setSortedHappenings] = useState([]);

    // Clear happenings when the selected year or month changes
    useEffect(() => {
        if (!selectedYear || !selectedMonth) {
            // When year or month is not selected, clear happenings
            setHappenings({});
            setSortedHappenings([]);
            console.log("Cleared happenings due to year or month change");
        }
    }, [selectedYear, selectedMonth, setHappenings]);

    useEffect(() => {
        console.log('Rendering happenings:', happenings);
        console.log('Selected day:', selectedDay);
    
        if (!selectedDay) {
            console.log('No selected day provided. Skipping rendering.');
            setSortedHappenings([]);
            return;
        }
    
        // Extract the happenings for the selected day using local time at each happening's location
        let dayHappenings = happenings[selectedDay] || [];
    
        // Sort the happenings by start time if there are any
        if (dayHappenings.length > 0) {
            const sortedData = dayHappenings.sort((a, b) => {
                const aTimestamp = a.activitySegment?.duration?.startTimestamp || a.placeVisit?.duration?.startTimestamp;
                const bTimestamp = b.activitySegment?.duration?.startTimestamp || b.placeVisit?.duration?.startTimestamp;
                return new Date(aTimestamp) - new Date(bTimestamp);
            });
    
            console.log('Sorted happenings for the selected day:', sortedData);
    
            // Only update setHappenings if the new sortedData is different
            if (JSON.stringify(happenings[selectedDay]) !== JSON.stringify(sortedData)) {
                setHappenings(prevHappenings => ({ ...prevHappenings, [selectedDay]: sortedData }));
            }
    
            setSortedHappenings(sortedData);
        } else {
            console.log('No happenings found for the selected day.');
            setSortedHappenings([]);
        }
    }, [happenings, selectedDay, setHappenings]);
    
    // Function to calculate duration between start and end timestamps
    const calculateDuration = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const durationMs = endDate - startDate;

        const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
        const hours = Math.floor((durationMs / (1000 * 60 * 60)) % 24);
        const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));

        let durationString = '';
        if (days > 0) {
            durationString += `${days} days, `;
        }
        if (hours > 0 || days > 0) {
            durationString += `${hours} hrs, `;
        }
        durationString += `${minutes} min`;

        return durationString;
    };

    // Function to format the local time of each happening based on its specific timezone
    const formatLocalTime = (timestamp, timezone) => {
        if (timezone && timezone !== 'Unknown Timezone') {
            return moment(timestamp).tz(timezone).format('YYYY-MM-DD HH:mm:ss z');
        }
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="happenings-container">
            {sortedHappenings.length === 0 ? (
                <p>No happenings to display</p>
            ) : (
                sortedHappenings.map((happening, index) => {
                    const isActivity = !!happening.activitySegment;
                    const duration = isActivity
                        ? happening.activitySegment.duration
                        : happening.placeVisit.duration;

                    const startTimestamp = duration.startTimestamp;
                    const endTimestamp = duration.endTimestamp;

                    // Determine the preferred display for placeVisit
                    let locationDescription = 'Unknown Location';
                    if (!isActivity) {
                        const { location } = happening.placeVisit;
                        if (location.semanticType) {
                            locationDescription = location.semanticType.split('_')[1] || location.semanticType;
                        } else if (location.name) {
                            locationDescription = location.name;
                        } else if (location.address) {
                            locationDescription = location.address;
                        }
                    }

                    // Determine timezone to format the start time and end time if necessary
                    let formattedStartTime = startTimestamp;
                    if (isActivity) {
                        const startLocationTimezone = happening.activitySegment.startLocationTimezone;
                        if (startLocationTimezone) {
                            formattedStartTime = formatLocalTime(startTimestamp, startLocationTimezone);
                        }
                    } else {
                        const placeVisitTimezone = happening.placeVisit.locationTimezone;
                        if (placeVisitTimezone) {
                            formattedStartTime = formatLocalTime(startTimestamp, placeVisitTimezone);
                        }
                    }

                    // Format end time for the last activity of the day
                    let formattedEndTime = null;
                    if (isActivity && endTimestamp) {
                        const endLocationTimezone = happening.activitySegment.endLocationTimezone;
                        if (endLocationTimezone) {
                            formattedEndTime = formatLocalTime(endTimestamp, endLocationTimezone);
                        }
                    }

                    // Calculate the duration
                    const durationString = calculateDuration(startTimestamp, endTimestamp);

                    return (
                        <div 
                            key={index} 
                            className="happening-box"
                            onMouseEnter={() => setHoveredHappening(happening)}
                            onMouseLeave={() => setHoveredHappening(null)}
                        >
                            <div className="happening-main">
                                {isActivity ? happening.activitySegment.activityType : locationDescription}
                            </div>
                            <div className="happening-details">
                                <p className="happening-time">Start: {formattedStartTime}</p>
                                <p className="happening-duration">Duration: {durationString}</p>
                                {formattedEndTime && <p className="happening-time">End: {formattedEndTime}</p>}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}

export default LowerLeftPane;
