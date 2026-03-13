import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_URL } from "../config";
import "./UserDashboard.css";

export default function UserDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location?.state?.filter) {
      setFilter(location.state.filter);
    }
  }, [location]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/reports/user`, {
        headers: { 'x-auth-token': token }
      });
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  const isResolved = (r) => ['resolved', 'closed', 'completed'].includes((r?.status || "").toLowerCase());
  
  const stats = {
    total: reports.length,
    resolved: reports.filter(isResolved).length,
    pending: reports.filter(r => !isResolved(r)).length
  };

  const filteredReports = reports.filter((r) => {
    if (filter === "all") return true;
    if (filter === "resolved") return isResolved(r);
    if (filter === "pending") return !isResolved(r);
    return true;
  });

  return (
    <div className="user-dashboard">
      <Navbar />
      
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1>My Citizen Dashboard</h1>
          <p>Tracking your contributions to a better city.</p>
        </header>

        <div className="stats-row">
            <div className={`stat-box ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                <span className="stat-label">Total Reports</span>
                <span className="stat-value">{stats.total}</span>
            </div>
            <div className={`stat-box pending ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
                <span className="stat-label">In Progress</span>
                <span className="stat-value">{stats.pending}</span>
            </div>
            <div className={`stat-box resolved ${filter === 'resolved' ? 'active' : ''}`} onClick={() => setFilter('resolved')}>
                <span className="stat-label">Resolved</span>
                <span className="stat-value">{stats.resolved}</span>
            </div>
        </div>

        {loading ? (
            <div className="skeleton-grid">
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton-card"></div>)}
            </div>
        ) : error ? (
            <div className="error-state">{error}</div>
        ) : (
            <div className="reports-grid">
                {filteredReports.map((report) => (
                    <div key={report._id} className="report-card">
                        <div className="card-top">
                            <img 
                                src={report.imageUrl} 
                                alt="issue" 
                                onError={(e) => e.target.src = "https://via.placeholder.com/300?text=Image+Not+Found"}
                            />
                            <div className={`status-pill ${report.status}`}>{report.status}</div>
                        </div>
                        <div className="card-bottom">
                            <span className="category-label">{report.category.replace('_', ' ')}</span>
                            <h3>{report.description.substring(0, 60)}...</h3>
                            <div className="card-meta">
                                <span>📍 {report.location?.city || 'Local Area'}</span>
                                <span>📅 {new Date(report.timestamp).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredReports.length === 0 && <p className="empty-msg">No reports found for this category.</p>}
            </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
