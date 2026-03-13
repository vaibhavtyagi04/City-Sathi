import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FaCity, FaExclamationTriangle, FaCheckCircle, FaClock } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { API_URL } from '../config';
import './MunicipalityDashboard.css';

const MunicipalityDashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
    const [selectedReport, setSelectedReport] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [reviewRemarks, setReviewRemarks] = useState('');
    const [reviewStatus, setReviewStatus] = useState('');
    const [userDept, setUserDept] = useState('');

    useEffect(() => {
        fetchDepartmentReports();
    }, []);

    const fetchDepartmentReports = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/reports/dept/assigned`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            if (res.ok) {
                setReports(data);
                calculateStats(data);
                // Extract dept from first report or user profile (using first report as shortcut here)
                if (data.length > 0) setUserDept(data[0].department);
            } else {
                toast.error(data.msg || 'Failed to fetch reports');
            }
        } catch (error) {
            toast.error('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const total = data.length;
        const resolved = data.filter(r => r.status === 'resolved').length;
        const pending = total - resolved;
        setStats({ total, pending, resolved });
    };

    const openModal = (report) => {
        setSelectedReport(report);
        setReviewStatus(report.status);
        setReviewRemarks(report.remarks || '');
        setShowModal(true);
    };

    const handleUpdateStatus = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/reports/${selectedReport._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: reviewStatus, remarks: reviewRemarks })
            });

            if (res.ok) {
                toast.success('Report updated successfully');
                setShowModal(false);
                fetchDepartmentReports();
            } else {
                const data = await res.json();
                toast.error(data.msg || 'Update failed');
            }
        } catch (error) {
            toast.error('Server error');
        }
    };

    const chartData = [
        { name: 'Pending', value: stats.pending, color: '#f59e0b' },
        { name: 'Resolved', value: stats.resolved, color: '#10b981' }
    ];

    return (
        <div className="muni-dashboard">
            <Navbar />
            
            <div className="muni-content">
                <header className="muni-header">
                    <div className="header-info">
                        <h1>Municipality Dashboard</h1>
                        <p className="dept-tag"><FaCity /> Department: {userDept.toUpperCase()}</p>
                    </div>
                </header>

                <div className="stats-grid">
                    <div className="stat-card total">
                        <FaExclamationTriangle className="stat-icon" />
                        <div>
                            <h3>Total Assigned</h3>
                            <p>{stats.total}</p>
                        </div>
                    </div>
                    <div className="stat-card pending">
                        <FaClock className="stat-icon" />
                        <div>
                            <h3>Pending</h3>
                            <p>{stats.pending}</p>
                        </div>
                    </div>
                    <div className="stat-card resolved">
                        <FaCheckCircle className="stat-icon" />
                        <div>
                            <h3>Resolved</h3>
                            <p>{stats.resolved}</p>
                        </div>
                    </div>
                </div>

                <div className="muni-main">
                    <div className="reports-section">
                        <h2>Assigned Complaints</h2>
                        {loading ? (
                            <div className="skeleton-table">
                                {[...Array(5)].map((_, i) => <div key={i} className="skeleton-row"></div>)}
                            </div>
                        ) : (
                            <table className="muni-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Category</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map(report => (
                                        <tr key={report._id}>
                                            <td>{new Date(report.timestamp).toLocaleDateString()}</td>
                                            <td>{report.category.replace('_', ' ')}</td>
                                            <td>{report.description.substring(0, 30)}...</td>
                                            <td><span className={`status-tag ${report.status}`}>{report.status}</span></td>
                                            <td>
                                                <button className="btn-action" onClick={() => openModal(report)}>Update</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="analytics-section">
                        <h2>Resolution Overview</h2>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="muni-modal-overlay">
                    <div className="muni-modal">
                        <h2>Update Complaint</h2>
                        {selectedReport && (
                            <div className="modal-content">
                                <p><strong>Category:</strong> {selectedReport.category}</p>
                                <p><strong>Description:</strong> {selectedReport.description}</p>
                                
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
                                        <option value="pending">Pending</option>
                                        <option value="in-review">In Review</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Action Remarks</label>
                                    <textarea 
                                        value={reviewRemarks}
                                        onChange={(e) => setReviewRemarks(e.target.value)}
                                        placeholder="Enter details of work done..."
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button className="btn-save" onClick={handleUpdateStatus}>Save Changes</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MunicipalityDashboard;
