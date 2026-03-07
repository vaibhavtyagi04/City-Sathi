import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "./ProfilePage.css";
import {
  FaUserCircle, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt,
  FaSignOutAlt, FaFileAlt, FaUser, FaClock, FaCity, FaCheckCircle, FaHourglassHalf
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { API_URL } from '../config';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState({ total: 0, resolved: 0, pending: 0 });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Fetch User Data
        const userRes = await fetch(`${API_URL}/auth/me`, {
          headers: { 'x-auth-token': token }
        });
        if (!userRes.ok) {
          // If user check fails, token is likely invalid
          throw new Error('Failed to load profile');
        }
        const user = await userRes.json();
        setUserData(user);

        // Fetch Reports (fail gracefully)
        try {
          const reportsRes = await fetch(`${API_URL}/reports/user`, {
            headers: { 'x-auth-token': token }
          });
          if (reportsRes.ok) {
            const reports = await reportsRes.json();

            const total = reports.length;
            const resolved = reports.filter(r =>
              ['resolved', 'closed', 'completed'].includes((r.status || '').toLowerCase())
            ).length;
            const pending = total - resolved;

            setCounts({ total, resolved, pending });
          }
        } catch (reportErr) {
          console.error("Failed to load reports:", reportErr);
          // Do not clear token or navigate away just because reports failed
        }

      } catch (err) {
        console.error(err);
        setError("Session expired or invalid. Please login again.");
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (error) {
    return (
      <div style={styles.loading}>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => window.location.reload()} style={styles.logoutBtn}>Retry</button>
      </div>
    );
  }

  if (!userData) {
    return <div style={styles.loading}>Loading profile...</div>;
  }

  return (
    <div style={styles.container}>
      <Navbar />

      {/* Banner */}
      <div style={styles.banner}>
        <h1 style={styles.bannerText}>🌍 CitySathi</h1>
        <p style={styles.bannerSubText}>
          Citizen Profile — Together for a Cleaner, Smarter City
        </p>
      </div>

      {/* Main layout */}
      <div style={styles.main}>
        {/* Left Profile Card */}
        <div style={styles.left}>
          <FaUserCircle size={100} color="#2c7a7b" />
          <h2 style={styles.username}>{userData.fullName}</h2>
          <p style={styles.email}><FaEnvelope /> {userData.email}</p>
          <p><FaPhoneAlt /> {userData.phone || 'Not provided'}</p>
          <p><FaMapMarkerAlt /> {userData.city || ''}, {userData.province || ''}</p>

          <button onClick={handleLogout} style={styles.logoutBtn}>
            <FaSignOutAlt style={{ marginRight: '6px' }} /> Logout
          </button>
        </div>

        {/* Right Info Section */}
        <div style={styles.right}>
          <h3 style={styles.sectionTitle}><FaUser /> Profile Overview</h3>

          <div style={styles.infoRow}><strong>Name:</strong> {userData.fullName}</div>
          <div style={styles.infoRow}><strong>Address:</strong> {userData.address || "-"}</div>
          <div style={styles.infoRow}><strong>Phone:</strong> {userData.phone || 'Not provided'}</div>
          <div style={styles.infoRow}><FaCity /> <strong>Province:</strong> {userData.province || "-"}</div>
          <div style={styles.infoRow}><FaMapMarkerAlt /> <strong>City:</strong> {userData.city || "-"}</div>
          <div style={styles.infoRow}><FaClock /> <strong>Joined on:</strong> {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "-"}</div>

          {/* Stats */}
          <div style={styles.statsContainer}>
            <div
              style={{ ...styles.statCard, cursor: "pointer" }}
              onClick={() => navigate("/reports", { state: { filter: "all" } })}
              title="Click to view all reports"
            >
              <FaFileAlt size={28} color="#2c7a7b" />
              <p><strong>{counts.total}</strong> Reports</p>
            </div>
            <div
              style={{ ...styles.statCard, cursor: "pointer" }}
              onClick={() => navigate("/reports", { state: { filter: "resolved" } })}
              title="Click to view resolved reports"
            >
              <FaCheckCircle size={28} color="green" />
              <p><strong>{counts.resolved}</strong> Resolved</p>
            </div>
            <div
              style={{ ...styles.statCard, cursor: "pointer" }}
              onClick={() => navigate("/reports", { state: { filter: "pending" } })}
              title="Click to view pending reports"
            >
              <FaHourglassHalf size={28} color="orange" />
              <p><strong>{counts.pending}</strong> Pending</p>
            </div>
          </div>

          <Link to="/reports" style={styles.reportLink}>
            <FaFileAlt /> View My Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

/* ---------- Styles (same as before) ---------- */
const styles = {
  container: {
    fontFamily: 'Segoe UI, Arial, sans-serif',
    background: '#f0f4f8',
    minHeight: '100vh',
  },
  banner: {
    textAlign: 'center',
    background: 'linear-gradient(90deg, #2c7a7b, #38a169)',
    color: 'white',
    padding: '2rem 1rem',
    borderBottomLeftRadius: '20px',
    borderBottomRightRadius: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  bannerText: {
    margin: 0,
    fontSize: '32px',
    fontWeight: '700',
  },
  bannerSubText: {
    marginTop: '8px',
    fontSize: '16px',
    fontStyle: 'italic',
  },
  main: {
    display: 'flex',
    padding: '2rem',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  left: {
    flex: '1',
    background: '#fff',
    padding: '2rem',
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  username: {
    marginBottom: '0.5rem',
    fontSize: '22px',
    color: '#2c7a7b',
    fontWeight: '600',
  },
  email: {
    color: '#555',
    marginBottom: '1rem',
  },
  right: {
    flex: '2',
    background: '#fff',
    padding: '2rem',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    marginBottom: '1rem',
    fontSize: '20px',
    color: '#2c7a7b',
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '6px',
  },
  infoRow: {
    marginBottom: '0.8rem',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '1.5rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    background: '#f9fafb',
    padding: '1rem',
    borderRadius: '12px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    textAlign: 'center',
    flex: '1',
    margin: '0 10px',
  },
  reportLink: {
    display: 'inline-block',
    background: '#93adadff',
    color: '#fff',
    padding: '10px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  logoutBtn: {
    marginTop: '20px',
    background: '#e60000',
    color: '#fff',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loading: {
    padding: '2rem',
    textAlign: 'center',
    fontSize: '18px',
  },
};
