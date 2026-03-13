import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaHandsHelping, FaPaw, FaTrash, FaCheckCircle, FaMapMarkerAlt } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { API_URL } from '../config';
import './NgoDashboard.css';

const NgoDashboard = () => {
    const [availableReports, setAvailableReports] = useState([]);
    const [myClaims, setMyClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('available');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        const token = localStorage.getItem('token');
        try {
            // Fetch available community reports
            const availRes = await fetch(`${API_URL}/reports/ngo/available`, {
                headers: { 'x-auth-token': token }
            });
            const availData = await availRes.json();
            
            // For now, filtering user's claims from a general list or separate endpoint
            // In a real app, we'd have a specific /ngo/my-claims endpoint
            const allRes = await fetch(`${API_URL}/reports/admin/all`, { // Re-using admin/all for simplicity or proper NGO endpoint
                headers: { 'x-auth-token': token }
            });
            const allData = await allRes.json();
            
            if (availRes.ok) setAvailableReports(availData);
            if (allRes.ok) {
                const userId = JSON.parse(atob(token.split('.')[1])).user.id;
                setMyClaims(allData.filter(r => r.assignedTo?._id === userId || r.assignedTo === userId));
            }
        } catch (error) {
            toast.error('Failed to sync with server');
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (reportId) => {
        const token = localStorage.getItem('token');
        const userId = JSON.parse(atob(token.split('.')[1])).user.id;
        try {
            const res = await fetch(`${API_URL}/reports/${reportId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ assignedTo: userId, status: 'in-review' })
            });

            if (res.ok) {
                toast.success('Issue claimed! Happy volunteering.');
                fetchReports();
            } else {
                toast.error('Claim failed');
            }
        } catch (error) {
            toast.error('Server error');
        }
    };

    const handleResolve = async (reportId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/reports/${reportId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: 'resolved', remarks: 'Resolved by NGO Volunteer' })
            });

            if (res.ok) {
                toast.success('Congratulations! You made a difference.');
                fetchReports();
            }
        } catch (error) {
            toast.error('Server error');
        }
    };

    const getIcon = (cat) => {
        if (cat === 'stray_animal') return <FaPaw />;
        if (cat === 'garbage') return <FaTrash />;
        return <FaHandsHelping />;
    };

    return (
        <div className="ngo-dashboard">
            <Navbar />
            <div className="ngo-content">
                <header className="ngo-header">
                    <h1>NGO & Volunteer Portal</h1>
                    <p>Harnessing community power for a better city.</p>
                </header>

                <div className="ngo-tabs">
                    <button 
                        className={activeTab === 'available' ? 'active' : ''} 
                        onClick={() => setActiveTab('available')}
                    >
                        Available Issues ({availableReports.length})
                    </button>
                    <button 
                        className={activeTab === 'my-claims' ? 'active' : ''} 
                        onClick={() => setActiveTab('my-claims')}
                    >
                        My Actions ({myClaims.length})
                    </button>
                </div>

                <div className="ngo-grid">
                    {activeTab === 'available' ? (
                        availableReports.length > 0 ? (
                            availableReports.map(report => (
                                <div key={report._id} className="ngo-card">
                                    <div className="card-image">
                                        <img src={report.imageUrl} alt="issue" />
                                        <div className="category-badge">
                                            {getIcon(report.category)} {report.category.replace('_', ' ')}
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <p className="location"><FaMapMarkerAlt /> {report.location?.address || 'Near you'}</p>
                                        <h3>{report.description.substring(0, 50)}...</h3>
                                        <button className="btn-claim" onClick={() => handleClaim(report._id)}>Claim Issue</button>
                                    </div>
                                </div>
                            ))
                        ) : <p className="empty-state">No available issues. Check back later!</p>
                    ) : (
                        myClaims.length > 0 ? (
                            myClaims.map(report => (
                                <div key={report._id} className="ngo-card claimed">
                                    <div className="card-image">
                                        <img src={report.imageUrl} alt="issue" />
                                        <div className={`status-badge ${report.status}`}>{report.status}</div>
                                    </div>
                                    <div className="card-body">
                                        <h3>{report.description}</h3>
                                        <p className="meta">Reported on: {new Date(report.timestamp).toLocaleDateString()}</p>
                                        {report.status !== 'resolved' && (
                                            <button className="btn-resolve" onClick={() => handleResolve(report._id)}>
                                                <FaCheckCircle /> Mark Resolved
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : <p className="empty-state">You haven't claimed any issues yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NgoDashboard;
