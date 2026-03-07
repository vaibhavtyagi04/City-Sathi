// ViewReports.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { API_URL } from "../config";

export default function ViewReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'pending' | 'resolved'
  const navigate = useNavigate();
  const location = useLocation();

  // Accept initial filter from navigation state (Profile link can pass this)
  useEffect(() => {
    if (location?.state?.filter) {
      setFilter(location.state.filter);
    }
  }, [location]);

  useEffect(() => {
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
        setError("Failed to load reports. Please check permissions.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [navigate]);

  // helper classification — customize to match your app's status values
  const isResolved = (r) => {
    const s = (r?.status || "").toString().toLowerCase();
    return s === "resolved" || s === "closed" || s === "completed";
  };
  const isPending = (r) => {
    const s = (r?.status || "").toString().toLowerCase();
    // treat unknown/empty status as pending
    return s === "pending" || s === "in-progress" || s === "" || s === "open";
  };

  const totalCount = reports.length;
  const resolvedCount = reports.filter(isResolved).length;
  const pendingCount = reports.filter((r) => !isResolved(r)).length; // fallback

  const filteredReports = reports.filter((r) => {
    if (filter === "all") return true;
    if (filter === "resolved") return isResolved(r);
    if (filter === "pending") return !isResolved(r);
    return true;
  });

  return (
    <>
      <Navbar />
      <div className="reports-page" style={{ padding: 24 }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span role="img" aria-label="reports">📊</span> My Reports
        </h2>

        {/* Stats / quick filters */}
        <div style={{
          display: "flex",
          gap: 12,
          margin: "12px 0 20px 0",
          alignItems: "center",
          flexWrap: "wrap"
        }}>

          <button
            onClick={() => setFilter("all")}
            className={`stat-btn ${filter === "all" ? "active" : ""}`}
          >
            📋 All <strong style={{ marginLeft: 6 }}>{totalCount}</strong>
          </button>

          <button
            onClick={() => setFilter("resolved")}
            className={`stat-btn ${filter === "resolved" ? "active" : ""}`}
          >
            ✅ Resolved <strong style={{ marginLeft: 6 }}>{resolvedCount}</strong>
          </button>

          <button
            onClick={() => setFilter("pending")}
            className={`stat-btn ${filter === "pending" ? "active" : ""}`}
          >
            ⏳ Pending <strong style={{ marginLeft: 6 }}>{pendingCount}</strong>
          </button>
        </div>

        {loading && <p>Loading reports...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <div className="reports-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 16
        }}>
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <div key={report._id} className="report-card" style={{
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}>
                {report.imageUrl ? (
                  <img
                    src={report.imageUrl.startsWith('http') ? report.imageUrl : `${API_URL.replace('/api', '')}${report.imageUrl}`}
                    alt="issue"
                    style={{ width: "100%", height: 160, objectFit: "cover" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/300?text=Image+Not+Found";
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100%", height: 120, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    background: "#f4f6f7", color: "#788b8b"
                  }}>
                    No image
                  </div>
                )}

                <div style={{ padding: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>📌 {report.category || "General"}</h3>
                  <p style={{ margin: "8px 0", color: "#333" }}>
                    {report.description || "No description provided."}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>📍</strong>{" "}
                    {report.location?.address || (report.location?.lat && report.location?.lng)
                      ? `${report.location?.lat}, ${report.location?.lng}`
                      : "Location not set"}
                  </p>
                  <p style={{ margin: "8px 0 0 0", color: "#555", fontSize: 13 }}>
                    <small>🕒 {report.timestamp ? new Date(report.timestamp).toLocaleString() : "No time recorded"}</small>
                    {" • "}
                    <small>Status: <strong>{report.status || "pending"}</strong></small>
                  </p>
                </div>
              </div>
            ))
          ) : (
            !loading && <p>No reports found for this filter.</p>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
