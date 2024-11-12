import React, { useEffect, useRef, useContext, useState } from 'react';
import './RightPane.css';
import { AppContext } from './HoverContext';

function loadGoogleMapsScript(callback) {
    const existingScript = Array.from(document.getElementsByTagName('script'))
        .find(script => script.src.includes('maps.googleapis.com/maps/api/js'));

    if (!existingScript) {
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY; // Use environment variable
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
        script.id = 'googleMaps';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            console.log("Google Maps script loaded successfully");
            if (callback) {
                callback();
            }
        };
        document.body.appendChild(script);
    } else if (existingScript && callback) {
        if (typeof window.google !== 'undefined') {
            callback();
        } else {
            existingScript.addEventListener('load', callback);
        }
    }
}

function RightPane() {
    const { happenings, hoveredHappening, selectedDay, setHappenings, setSelectedDay } = useContext(AppContext);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const polylinesRef = useRef([]);
    const [isMapScriptLoaded, setIsMapScriptLoaded] = useState(false);

    useEffect(() => {
        loadGoogleMapsScript(() => {
            setIsMapScriptLoaded(true);
            console.log("Map script loaded, isMapScriptLoaded set to true");
        });
    }, []);

    useEffect(() => {
        if (!isMapScriptLoaded) {
            console.log("Map script not yet loaded, skipping map initialization");
            return;
        }
        
        if (!selectedDay || !happenings || Object.keys(happenings).length === 0) {
            console.log("No selectedDay or happenings, skipping map initialization");
            clearMap();
            return;
        }

        if (!mapRef.current) {
            console.error("Map reference is not available yet.");
            return; // Ensure the map container is ready
        }

        if (!window.google || !window.google.maps) {
            console.error("Google Maps API not fully loaded.");
            return;
        }

        console.log("Initializing Google Map...");

        try {
            const mapId = process.env.REACT_APP_GOOGLE_MAPS_MAP_ID; // Use environment variable
            const map = new window.google.maps.Map(mapRef.current, {
                mapId: mapId,
                center: { lat: 0, lng: 0 },
                zoom: 2,
            });

            const bounds = new window.google.maps.LatLngBounds();
            markersRef.current = [];
            polylinesRef.current = [];

            // If a specific day is selected, render only happenings for that day
            const daysToRender = selectedDay ? [selectedDay] : Object.keys(happenings);

            daysToRender.forEach(dateKey => {
                const dayHappenings = happenings[dateKey];

                dayHappenings.forEach(happening => {
                    if (happening.placeVisit) {
                        const { latitudeE7, longitudeE7 } = happening.placeVisit.location;
                        if (latitudeE7 && longitudeE7) {
                            const lat = latitudeE7 / 1e7;
                            const lng = longitudeE7 / 1e7;

                            if (!isNaN(lat) && !isNaN(lng)) {
                                const markerElement = document.createElement('div');
                                markerElement.className = 'custom-marker';
                                const marker = new window.google.maps.marker.AdvancedMarkerElement({
                                    position: { lat, lng },
                                    map,
                                    content: markerElement,
                                });
                                markersRef.current.push(marker);
                                bounds.extend({ lat, lng });
                            }
                        }
                    } else if (happening.activitySegment) {
                        const { startLocation, endLocation, activityType } = happening.activitySegment;
                        if (startLocation && endLocation) {
                            const startLat = startLocation.latitudeE7 / 1e7;
                            const startLng = startLocation.longitudeE7 / 1e7;
                            const endLat = endLocation.latitudeE7 / 1e7;
                            const endLng = endLocation.longitudeE7 / 1e7;

                            if (!isNaN(startLat) && !isNaN(startLng) && !isNaN(endLat) && !isNaN(endLng)) {
                                const pathCoordinates = [
                                    { lat: startLat, lng: startLng },
                                    { lat: endLat, lng: endLng }
                                ];

                                console.log('Drawing polyline with coordinates:', pathCoordinates);

                                // Determine the color based on the activity type
                                let strokeColor;
                                switch (activityType) {
                                    case 'IN_SUBWAY':
                                        strokeColor = '#0047AB'; // Dark Blue
                                        break;
                                    case 'IN_TRAIN':
                                        strokeColor = '#0047AB'; // Dark Blue
                                        break;
                                    case 'IN_BUS':
                                        strokeColor = '#0047AB'; // Dark Blue
                                        break;
                                    case 'IN_TAXI':
                                        strokeColor = '#0047AB'; // Dark Blue
                                        break;
                                    case 'FLYING':
                                        strokeColor = '#0047AB'; // Dark Blue
                                        break;
                                    case 'DRIVING':
                                        strokeColor = '#0047AB'; // Dark Blue
                                        break;
                                    case 'CYCLING':
                                        strokeColor = '#89CFF0'; // Blue-Green
                                        break;
                                    case 'WALKING':
                                        strokeColor = '#00BFFF'; // Medium Blue
                                        break;
                                    default:
                                        strokeColor = '#00BFFF'; // Default Medium Blue for unknown activities
                                }

                                const polyline = new window.google.maps.Polyline({
                                    path: pathCoordinates,
                                    geodesic: true,
                                    strokeColor,
                                    strokeOpacity: 0.8,
                                    strokeWeight: 5,
                                    map,
                                });
                                polyline.originalStrokeColor = strokeColor; // Store the original color
                                polylinesRef.current.push(polyline);

                                bounds.extend({ lat: startLat, lng: startLng });
                                bounds.extend({ lat: endLat, lng: endLng });
                            }
                        }
                    }
                });
            });

            // Adjust the map to fit all markers and paths
            if (!bounds.isEmpty()) {
                map.fitBounds(bounds);
            }
        } catch (e) {
            console.error("Failed to initialize map:", e);
        }
    }, [happenings, selectedDay, isMapScriptLoaded]);

    const clearMap = () => {
        if (markersRef.current) {
            markersRef.current.forEach(marker => marker.map = null);
            markersRef.current = [];
        }
        if (polylinesRef.current) {
            polylinesRef.current.forEach(polyline => polyline.setMap(null));
            polylinesRef.current = [];
        }
        if (mapRef.current) {
            mapRef.current.innerHTML = ""; // Clear the map container
        }
    };

    useEffect(() => {
        if (hoveredHappening) {
            // Grow the corresponding marker or polyline
            if (hoveredHappening.placeVisit) {
                const { latitudeE7, longitudeE7 } = hoveredHappening.placeVisit.location;
                if (latitudeE7 && longitudeE7) {
                    const lat = latitudeE7 / 1e7;
                    const lng = longitudeE7 / 1e7;
                    markersRef.current.forEach(marker => {
                        if (marker.position.lat === lat && marker.position.lng === lng) {
                            marker.content.style.transform = 'scale(1.5)'; // Make marker larger
                        }
                    });
                }
            } else if (hoveredHappening.activitySegment) {
                const { startLocation, endLocation } = hoveredHappening.activitySegment;
                if (startLocation && endLocation) {
                    const startLat = startLocation.latitudeE7 / 1e7;
                    const startLng = startLocation.longitudeE7 / 1e7;
                    const endLat = endLocation.latitudeE7 / 1e7;
                    const endLng = endLocation.longitudeE7 / 1e7;

                    polylinesRef.current.forEach(polyline => {
                        const path = polyline.getPath().getArray();
                        if (
                            path[0].lat() === startLat && path[0].lng() === startLng &&
                            path[1].lat() === endLat && path[1].lng() === endLng
                        ) {
                            polyline.setOptions({
                                strokeWeight: 10, // Increase line thickness to create the border effect
                                strokeColor: '#000000', // Set black as the outer border color
                                strokeOpacity: 1.0,
                            });
    
                            // Create an inner stroke with original color and lesser thickness
                            const innerStrokeWeight = 8; // Inner stroke thickness to create the border illusion
                            const originalStrokeColor = polyline.originalStrokeColor;
    
                            polyline.setOptions({
                                strokeWeight: innerStrokeWeight,
                                strokeColor: originalStrokeColor,
                                strokeOpacity: 1.0,
                            });
                        }
                    });
                }
            }
        } else {
            // Reset all markers and polylines to original size/color
            markersRef.current.forEach(marker => {
                marker.content.style.transform = 'scale(1)'; // Reset marker size
            });
            polylinesRef.current.forEach(polyline => {
                polyline.setOptions({
                    strokeWeight: 5, // Reset line thickness
                    strokeColor: polyline.originalStrokeColor || '#00BFFF', // Reset line color to the original or default
                    strokeOpacity: 0.8
                });
            });
        }
    }, [hoveredHappening]);

    return (
        <div className="right-pane">
            <div ref={mapRef} className="map-container"></div>
        </div>
    );
}

export default RightPane;
