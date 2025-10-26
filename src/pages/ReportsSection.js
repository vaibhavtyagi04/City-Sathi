// ViewReports.jsx
import React, { useEffect, useState } from "react";
import { query, collection, orderBy, getDocs, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useNavigate, useLocation } from "react-router-dom";

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
      if (!auth.currentUser) {
        navigate("/login");
        return;
      }

      try {
        const q = query(
          collection(db, "reports"),
          where("userId", "==", auth.currentUser.uid),
          orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setReports(docs);
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
            onClick={() => setFilter("Report")}
            className={`stat-btn ${filter === "Report" ? "active" : ""}`}
          >
          Report <strong style={{ marginLeft: 6 }}>{pendingCount}</strong>
          </button>
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
              <div key={report.id} className="report-card" style={{
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}>
                {report.imageUrl ? (
                  <img
                    src={report.imageUrl}
                    alt="issue"
                    style={{ width: "100%", height: 160, objectFit: "cover" }}
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
                    {report.location?.address || report.location?.lat && report.location?.lng
                      ? `${report.location?.lat}, ${report.location?.lng}`
                      : "Location not set"}
                  </p>
                  <p style={{ margin: "8px 0 0 0", color: "#555", fontSize: 13 }}>
                    <small>🕒 {report.timestamp ? report.timestamp.toDate().toLocaleString() : "No time recorded"}</small>
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
