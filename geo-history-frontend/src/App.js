import React, { useEffect, useContext } from 'react';
import './App.css';
import { AppContext } from './HoverContext';
import DateSelector from './DateSelector';
import LowerLeftPane from './LowerLeftPane';
import RightPane from './RightPane';
import { AppProvider } from './HoverContext';

function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}

function AppContent() {
    const { selectedYear, selectedMonth, setHappenings } = useContext(AppContext);
    const [loading, setLoading] = React.useState(false);

    useEffect(() => {
        if (selectedYear && selectedMonth) {
            setLoading(true); // Set loading to true when starting to fetch data
            fetch(`http://localhost:3001/api/happenings?year=${selectedYear}&month=${selectedMonth}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Server error: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    setHappenings(data); // Set the happenings state in the context
                    setLoading(false); // Set loading to false after data is fetched
                })
                .catch(error => {
                    console.error('Error fetching happenings:', error);
                    setLoading(false); // Set loading to false in case of error
                });
        }
    }, [selectedYear, selectedMonth, setHappenings]);

    return (
        <div className="app-container" style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100%' }}>
            {/* Left pane container */}
            <div className="left-pane-container" style={{ width: '45%', height: '100%' }}>
                {/* Upper left pane */}
                <div className="upper-left-pane">
                    <DateSelector />
                </div>

                {/* Lower left pane */}
                <div className="lower-left-pane">
                    <LowerLeftPane loading={loading} />
                </div>
            </div>

            {/* Right pane */}
            <div className="right-pane" style={{ width: '55%', height: '100%' }}>
                <RightPane />
            </div>
        </div>
    );
}

export default App;
