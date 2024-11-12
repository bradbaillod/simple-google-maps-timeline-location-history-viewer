import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [hoveredHappening, setHoveredHappening] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);
    const [happenings, setHappenings] = useState([]); // Added initialization for happenings

    return (
        <AppContext.Provider value={{
            hoveredHappening,
            setHoveredHappening,
            selectedYear,
            setSelectedYear,
            selectedMonth,
            setSelectedMonth,
            selectedDay,
            setSelectedDay,
            happenings,
            setHappenings, // Provide setHappenings to update it from other components
        }}>
            {children}
        </AppContext.Provider>
    );
};
