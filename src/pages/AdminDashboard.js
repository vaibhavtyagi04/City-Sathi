import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { API_URL } from '../config';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, resolved
    const [selectedReport, setSelectedReport] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [statusUpdate, setStatusUpdate] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/reports/admin/all`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            if (res.ok) {
                setReports(data);
            } else {
                alert(data.msg || 'Failed to fetch reports');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!selectedReport) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/reports/admin/${selectedReport._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: statusUpdate, remarks })
            });

            if (res.ok) {
                alert('Report updated successfully');
                setSelectedReport(null);
                setRemarks('');
                fetchReports(); // Refresh list
            } else {
                const data = await res.json();
                alert(data.msg || 'Update failed');
            }
        } catch (err) {
            console.error(err);
            alert('Server error');
        }
    };

    const openModal = (report) => {
        setSelectedReport(report);
        setStatusUpdate(report.status);
        setRemarks(report.remarks || '');
    };

    const filteredReports = reports.filter(r => filter === 'all' ? true : r.status === filter);

    const pendingCount = reports.filter(r => r.status === 'pending').length;
    const resolvedCount = reports.filter(r => r.status === 'resolved').length;

    return (
        <div className="admin-container">
            <Navbar />
            <div className="admin-content">
                <h1>Admin Dashboard 🛡️</h1>

                {/* Summary Cards */}
                <div className="summary-cards">
                    <div className="card total">
                        <h3>Total Reports</h3>
                        <p>{reports.length}</p>
                    </div>
                    <div className="card pending">
                        <h3>Pending</h3>
                        <p>{pendingCount}</p>
                    </div>
                    <div className="card resolved">
                        <h3>Resolved</h3>
                        <p>{resolvedCount}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters">
                    <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
                    <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pending</button>
                    <button className={filter === 'resolved' ? 'active' : ''} onClick={() => setFilter('resolved')}>Resolved</button>
                </div>

                {/* Reports Table */}
                {loading ? <p>Loading...</p> : (
                    <div className="reports-table-wrapper">
                        <table className="reports-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>User</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.map(report => (
                                    <tr key={report._id}>
                                        <td>{new Date(report.timestamp).toLocaleDateString()}</td>
                                        <td>{report.userId?.fullName || 'Unknown'}</td>
                                        <td>{report.category}</td>
                                        <td>{report.description.substring(0, 50)}...</td>
                                        <td>
                                            <span className={`status-badge ${report.status}`}>{report.status}</span>
                                        </td>
                                        <td>
                                            <button className="btn-review" onClick={() => openModal(report)}>Review</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Review Modal */}
                {selectedReport && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <h2>Review Report</h2>
                            <div className="report-details">
                                <img src={selectedReport.imageUrl} alt="Report" className="modal-img" />
                                <p><strong>Category:</strong> {selectedReport.category}</p>
                                <p><strong>Description:</strong> {selectedReport.description}</p>
                                <p><strong>Location:</strong> {selectedReport.location?.address || 'N/A'}</p>
                            </div>

                            <form onSubmit={handleUpdate}>
                                <label>Status:</label>
                                <select value={statusUpdate} onChange={(e) => setStatusUpdate(e.target.value)}>
                                    <option value="pending">Pending</option>
                                    <option value="in-review">In Review</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="rejected">Rejected</option>
                                </select>

                                <label>Remarks:</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Add admin remarks..."
                                    required
                                />

                                <div className="modal-actions">
                                    <button type="button" onClick={() => setSelectedReport(null)}>Cancel</button>
                                    <button type="submit" className="btn-save">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
