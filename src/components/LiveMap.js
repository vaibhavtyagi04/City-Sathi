import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { API_URL } from '../config';
import L from 'leaflet';

// Fix for default marker icon in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const CATEGORY_ICONS = {
    garbage: '#e53e3e',       // Red
    stray_animal: '#ed8936',  // Orange
    street_light: '#ecc94b',  // Yellow
    pothole: '#48bb78',       // Green (or mixed)
    drainage: '#4299e1',      // Blue
    other: '#a0aec0'          // Gray
};

const getCustomIcon = (category) => {
    const color = CATEGORY_ICONS[category] || '#3182ce';
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

const LiveMap = () => {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await fetch(`${API_URL}/reports`);
                if (res.ok) {
                    const data = await res.json();
                    setReports(data.filter(r => r.location && r.location.lat && r.location.lng));
                }
            } catch (err) {
                console.error("Error fetching reports for map:", err);
            }
        };

        fetchReports();
    }, []);

    // Default center (Ghaziabad)
    const position = [28.6692, 77.4538];

    return (
        <MapContainer center={position} zoom={13} style={{ height: "500px", width: "100%", borderRadius: "20px" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {reports.map((report) => (
                <Marker 
                    key={report._id} 
                    position={[report.location.lat, report.location.lng]}
                    icon={getCustomIcon(report.category)}
                >
                    <Popup>
                        <div style={{ textAlign: "center", minWidth: "150px" }}>
                            <strong style={{ textTransform: "uppercase", fontSize: "14px", color: CATEGORY_ICONS[report.category] }}>
                                {report.category.replace('_', ' ')}
                            </strong>
                            <p style={{ margin: "8px 0", fontSize: "13px", color: "#4a5568" }}>{report.description.substring(0, 60)}...</p>
                            {report.imageUrl && (
                                <img
                                    src={report.imageUrl}
                                    alt="Report"
                                    style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "8px" }}
                                />
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default LiveMap;
