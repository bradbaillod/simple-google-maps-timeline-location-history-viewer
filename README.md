# Simple Google Maps Timeline Location History Viewer

This project is a web application that allows users to view their Google Maps Timeline semantic location history files in a user-friendly, interactive interface. The project is split into two main parts:

- **Backend (geo-history-backend)**: Handles server-side operations, including reading Google Maps Timeline location history files and providing necessary data to the frontend.
- **Frontend (geo-history-frontend)**: Provides a browser-based interface for users to view, filter, and interact with their location history data, including listing "happenings" for a selected date and visualizing them on a map using the Google Maps API.
- Both backend and frontend can be run on the same personal computer such as a Windows or Mac machine.  They each handle a different part of the functionality.
- Some functionality from the Google Timeline was omitted here for speed and expediency; this application shows a straight line path for each segment, which is all that can be reliably reconstructed from the semantic location history.  To show more (such as the result of snap to road), the raw location history would need to be loaded which would be more complex and would slow the page down considerably.
- This does not allow the user to edit the timeline paths or events in any way, it only allows the user to view them.

## Project Structure

- `backend/`: Contains all backend-related files and logic.
  - Handles requests from the frontend.
  - Reads JSON files containing Google Maps semantic location history data.
  - Processes the data and provides it to the frontend via RESTful APIs.

- `frontend/`: Contains all frontend files and code.
  - Allows users to select a date and see the corresponding location history.
  - Displays location data in a list and on a map using the Google Maps API.
  - Provides interactive features like markers and paths that get visually highlighted when hovered over.

## Features

- **Interactive Timeline Viewer**: Users can select a specific year, month, and day to view the location data for that date.
- **List of Happenings**: Shows a list of places visited (`placeVisit`) and activities performed (`activitySegment`) on the selected day.
- **Map Visualization**: Uses the Google Maps API to display markers for places visited and paths for activities.
- **Hover Effects**: Hovering over items in the list highlights the corresponding markers and paths on the map, enhancing visualization.
- **Custom Markers and Path Styles**: Customizes markers and paths on the map for better visual distinction.

## Getting Started

### Prerequisites

- **Node.js**: The backend requires Node.js for running the server.
- **Python**: Some backend operations require Python.
- **Google Maps API Key**: You need a Google Maps API key to enable map features in the frontend. Set this key in the environment file as described below.
- **GOOGLE MAPS MAP ID** This is another Google Maps API thing you need to create and use.
   - It's expected that a single casual user would remain well under Google's free usage limits for the Maps API and the Map ID, and would never incur charges from normal use; however, they do need to set up a Google API account with a payment method.
- Your own Google Maps timeline history, downloaded from Google Takeout, unzipped and saved in a folder on your Mac or PC.  This is easy to do in the pre-11/19/2024 period using Google Takeout.  After 11/19, your cell phone will contain these files and getting them onto a PC will probably be slightly harder (but not impossible).
- UPDATE: Apparently Google Timeline stopped saving semantic location history after Nov 19, 2024.  So this application will only work for data before Nov 19, 2024, because it relies 100% on semantic location history.

### Installation

1. **Clone the repository**:
   ```sh
   git clone -b master https://github.com/bradbaillod/simple-google-maps-timeline-location-history-viewer.git
   cd simple-google-maps-timeline-location-history-viewer
   ```

2. **Backend Setup**:
   - Navigate to the `backend/` folder and install dependencies:
     ```sh
     cd geo-history-backend
     npm install
     ```
   - Create a Python virtual environment and activate it (if necessary for backend Python scripts).  (the instructions below assume that this virtual environment is given the name "venv")
   - Install Python dependencies if specified in any `requirements.txt` file.
   - Edit "index.js" to change the baseDir to the local folder on your Mac/PC titled "Semantic Location History" (from the Google Maps Timeline history which you downloaded from Google Takeout and unzipped onto your machine).

3. **Frontend Setup**:
   - Navigate to the `frontend/` folder and install dependencies:
     ```sh
     cd ../geo-history-frontend
     npm install
     ```

4. **Environment Variables**:
   - Create an `.env.development.local` file in the `frontend/` directory with your Google Maps API key:
     ```env
     REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
     REACT_APP_GOOGLE_MAPS_MAP_ID=YOUR_MAP_ID
     ```

### Running the Application

1. **Start the Backend**:
   - In the `backend/` directory, run:
     ```sh
     .\venv\Scripts\activate
     node index.js
     ```
   - This will start the server, which will handle data requests from the frontend.

2. **Start the Frontend**:
   - In the `frontend/` directory, run:
     ```sh
     npm start
     ```
   - This will open the application in your default web browser.

### Usage

- **Select a Date**: Use the dropdown menus in the upper left pane to select a year, month, and day.
- **View Happenings**: The lower left pane will display a list of locations visited and activities performed on the selected date, with timestamps keyed to the happening's own local time zone.
- **Map Interaction**: The right pane will show markers for locations and paths for activities on the selected date. Hover over a list item to see it highlighted on the map.

## Technologies Used

- **Node.js**: Backend server operations.
- **Python**: Data processing tasks in the backend.
- **React.js**: Frontend library for building the user interface.
- **Google Maps API**: For map visualization of location history data.

## License

This project is licensed under the GNU General Public License v3.0. See the `LICENSE` file for details.

## Contributing

- Brad Baillod, a novice web developer, wrote this with ChatGPT 4o's help.  This is meant to be a bare bones replacement for the Google Maps Timeline web interface which is being turned off on Nov  19, 2024.
- Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Acknowledgements

- Thanks to Google for providing the Google Maps API, which makes this visualization possible.
