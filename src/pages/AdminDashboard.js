import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { API_URL } from '../config';
import './AdminDashboard.css';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { toast } from 'react-toastify';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
                toast.error(data.msg || 'Failed to fetch reports');
            }
        } catch (err) {
            console.error(err);
            toast.error('Server error fetching reports');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!selectedReport) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/reports/${selectedReport._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: statusUpdate, remarks })
            });

            if (res.ok) {
                toast.success('Report updated successfully');
                setSelectedReport(null);
                setRemarks('');
                fetchReports(); // Refresh list
            } else {
                const data = await res.json();
                toast.error(data.msg || 'Update failed');
            }
        } catch (err) {
            console.error(err);
            toast.error('Server error updating report');
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
    const inReviewCount = reports.filter(r => r.status === 'in-review').length;

    // Data for charts
    const categoryDataMap = reports.reduce((acc, report) => {
      acc[report.category] = (acc[report.category] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.keys(categoryDataMap).map(cat => ({
      name: cat.replace('_', ' ').toUpperCase(),
      count: categoryDataMap[cat]
    }));

    return (
        <div className="admin-container">
            <Navbar />
            <div className="admin-content">
                <header className="admin-header">
                   <h1>Admin Dashboard 🛡️</h1>
                   <p>Manage and monitor civic issues reported by citizens.</p>
                </header>

                {/* Summary Cards */}
                <div className="summary-cards">
                    <div className="card total">
                        <h3>Total Issues</h3>
                        <p>{reports.length}</p>
                    </div>
                    <div className="card pending">
                        <h3>Pending</h3>
                        <p>{pendingCount}</p>
                    </div>
                    <div className="card in-review">
                        <h3>In Review</h3>
                        <p>{inReviewCount}</p>
                    </div>
                    <div className="card resolved">
                        <h3>Resolved</h3>
                        <p>{resolvedCount}</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="dashboard-charts">
                    <div className="chart-wrapper">
                        <h3>Issue Distribution by Category</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#3182ce" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="chart-wrapper">
                        <h3>Category Spread</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-container">
                   <h3>Recent Reports</h3>
                    <div className="filters">
                        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
                        <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pending</button>
                        <button className={filter === 'resolved' ? 'active' : ''} onClick={() => setFilter('resolved')}>Resolved</button>
                    </div>
                </div>

                {/* Reports Table */}
                {loading ? (
                    <div className="skeleton-wrapper">
                        <div className="skeleton-header"></div>
                        <div className="skeleton-table">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="skeleton-row"></div>
                            ))}
                        </div>
                    </div>
                ) : (
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
                                        <td className="category-cell">{report.category.replace('_', ' ')}</td>
                                        <td>{report.description.substring(0, 40)}...</td>
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
                            <div className="modal-header">
                                <h2>Review Report</h2>
                                <button className="close-modal" onClick={() => setSelectedReport(null)}>&times;</button>
                            </div>
                            <div className="modal-body">
                                <div className="report-preview">
                                    <img src={selectedReport.imageUrl} alt="Report" className="modal-img" />
                                    <div className="report-info">
                                        <p><strong>Category:</strong> {selectedReport.category.replace('_', ' ')}</p>
                                        <p><strong>User:</strong> {selectedReport.userId?.fullName || 'N/A'}</p>
                                        <p><strong>Location:</strong> {selectedReport.location?.address || 'N/A'}</p>
                                        <p><strong>Description:</strong></p>
                                        <p className="desc-text">{selectedReport.description}</p>
                                    </div>
                                </div>

                                <form onSubmit={handleUpdate} className="admin-form">
                                    <div className="form-group">
                                        <label>Update Status:</label>
                                        <select value={statusUpdate} onChange={(e) => setStatusUpdate(e.target.value)}>
                                            <option value="pending">Pending</option>
                                            <option value="in-review">In Review</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Admin Remarks:</label>
                                        <textarea
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="Provide update details to the citizen..."
                                            required
                                        />
                                    </div>

                                    <div className="modal-actions">
                                        <button type="button" className="btn-cancel" onClick={() => setSelectedReport(null)}>Cancel</button>
                                        <button type="submit" className="btn-save">Verify & Save</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
