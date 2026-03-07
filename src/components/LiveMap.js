import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { API_URL } from '../config';
import L from 'leaflet';

// Fix for default marker icon in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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
        <MapContainer center={position} zoom={13} style={{ height: "400px", width: "100%", borderRadius: "10px" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {reports.map((report) => (
                <Marker key={report._id} position={[report.location.lat, report.location.lng]}>
                    <Popup>
                        <div style={{ textAlign: "center" }}>
                            <strong>{report.category}</strong><br />
                            <p style={{ margin: "5px 0", fontSize: "12px" }}>{report.description.substring(0, 50)}...</p>
                            {report.imageUrl && (
                                <img
                                    src={report.imageUrl.startsWith('http') ? report.imageUrl : `http://localhost:5000${report.imageUrl}`}
                                    alt="Report"
                                    style={{ width: "100px", height: "70px", objectFit: "cover", borderRadius: "5px" }}
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
