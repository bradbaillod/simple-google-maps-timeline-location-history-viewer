import React, { useContext, useEffect } from 'react';
import moment from 'moment';
import { AppContext } from './HoverContext';

function DateSelector() {
    const { selectedYear, setSelectedYear, selectedMonth, setSelectedMonth, selectedDay, setSelectedDay } = useContext(AppContext);
    const [years, setYears] = React.useState([]);
    const [months, setMonths] = React.useState([]);
    const [days, setDays] = React.useState([]);

    useEffect(() => {
        // Fetch available years
        fetch('http://localhost:3001/api/years')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setYears(data);
                } else {
                    console.error('Invalid data format received for years:', data);
                    setYears([]);
                }
            })
            .catch(error => console.error('Error fetching years:', error));
    }, []);

    useEffect(() => {
        if (selectedYear) {
            // Fetch available months for the selected year
            fetch(`http://localhost:3001/api/months/${selectedYear}`)
                .then(response => response.json())
                .then(data => {
                    // Define the calendar order of months
                    const calendarMonths = [
                        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 
                        'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 
                        'NOVEMBER', 'DECEMBER'
                    ];
    
                    // Clean and filter the available months, then sort by calendar order
                    const cleanedMonths = data
                        .map(month => cleanMonthName(month, selectedYear))
                        .sort((a, b) => calendarMonths.indexOf(a) - calendarMonths.indexOf(b));
    
                    setMonths(cleanedMonths);
                })
                .catch(error => console.error('Error fetching months:', error));
        }
    }, [selectedYear]);

    useEffect(() => {
        if (selectedYear && selectedMonth) {
            // Use the /api/happenings endpoint to get data for the selected year and month
            fetch(`http://localhost:3001/api/happenings?year=${selectedYear}&month=${selectedMonth}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Server error: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    // Extract the day keys from the happenings data
                    const dayKeys = Object.keys(data);
                    // Extract only the day portion (e.g., '2024-06-01' -> '1')
                    const daysList = dayKeys.map(day => moment(day).date().toString());
                    setDays(daysList);
                })
                .catch(error => console.error('Error fetching days:', error));
        } else {
            setDays([]);
        }
    }, [selectedYear, selectedMonth]);

    const handleDropdownChange = (type, value) => {
        if (type === 'year') {
            setSelectedYear(value);
            setSelectedMonth(''); // Reset month and day when year changes
            setSelectedDay('');
        } else if (type === 'month') {
            setSelectedMonth(value);
            setSelectedDay(''); // Reset day when month changes
        } else if (type === 'day') {
            if (value === '') {
                setSelectedDay(null); // Set to null if no day is selected
            } else {
                // Construct the full date as YYYY-MM-DD
                const day = value.toString().padStart(2, '0');
                const month = months.indexOf(selectedMonth) + 1; // Convert month to numeric value
                const formattedMonth = month.toString().padStart(2, '0');
                const fullDate = `${selectedYear}-${formattedMonth}-${day}`;
                setSelectedDay(fullDate);
            }
        }
    };

    const cleanMonthName = (month, year) => {
        const prefix = `${year}_`;
        return month.startsWith(prefix) ? month.replace(prefix, '') : month;
    };

    return (
        <div className="date-selector">
            <select value={selectedYear || ''} onChange={e => handleDropdownChange('year', e.target.value)}>
                <option value="">Select Year</option>
                {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                ))}
            </select>
            
            <select value={selectedMonth || ''} onChange={e => handleDropdownChange('month', e.target.value)} disabled={!selectedYear}>
                <option value="">Select Month</option>
                {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                ))}
            </select>
            
            <select value={selectedDay ? moment(selectedDay).date().toString() : ''} onChange={e => handleDropdownChange('day', e.target.value)} disabled={!selectedMonth || days.length === 0}>
                <option value="">Select Day</option>
                {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                ))}
            </select>
        </div>
    );
}

export default DateSelector;
