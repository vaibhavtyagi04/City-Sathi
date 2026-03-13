import React from 'react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import './HomePage.css';
import LiveMap from '../components/LiveMap';

function HomePage() {
  return (
    <div>
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Report Civic Issues in Your <span>City Instantly</span>
          </h1>
          <p className="hero-subtitle">
            Upload a photo, auto-detect location, and track issue resolution. 
            Join us in making your community cleaner and safer.
          </p>

          <div className="hero-buttons">
            <Link to="/report" className="btn-primary">🚀 Report Issue</Link>
            <Link to="/reports" className="btn-outline">📊 View Dashboard</Link>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="features-section">
        <h3>Why Report?</h3>
        <div className="features-wrapper">
          <div className="feature-card">
            <h4>Report Issues</h4>
            <p>Quickly upload photos, videos, and descriptions of local issues.</p>
          </div>
          <div className="feature-card">
            <h4>Track Progress</h4>
            <p>See how your reports contribute to cleaner streets.</p>
          </div>
          <div className="feature-card">
            <h4>Earn Rewards</h4>
            <p>Receive incentives for active participation in keeping our city clean.</p>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="map-section">
        <h3>Live Report Map</h3>
        <div className="map-container">
          <LiveMap />
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <h3>About CitySathi</h3>
        <p>
          CitySathi is a community-driven initiative to help make Ghaziabad cleaner and safer by enabling citizens
          to report civic issues. Each report is a step towards a smarter and greener city.
        </p>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p><strong>CitySathi</strong> — Report. Act. Clean.</p>
        <p>Created for a cleaner Ghaziabad</p>
        <p>&copy; 2025 All rights reserved.</p>
      </footer>
    </div>
  );
}

export default HomePage;
