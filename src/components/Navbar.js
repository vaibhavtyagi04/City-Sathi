import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import Notifications from './Notifications';

import { jwtDecode } from "jwt-decode";

function Navbar() {
  let isAdmin = false;
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      isAdmin = decoded.user.role === 'admin';
    }
  } catch (error) {
    // Invalid token
  }

  return (
    <nav className="navbar">
      {/* Left Logo */}
      <h2 className="logo">CitySathi</h2>

      {/* Center Links */}
      <div className="links">
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/report">Submit Report</Link>
        <Link to="/reports">View Reports</Link>
        <Link to="/about">About</Link>
        <Link to="/about">About</Link>
        {isAdmin && <Link to="/admin" className="admin-link">Admin Dashboard</Link>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        {isAdmin || localStorage.getItem('token') ? <Notifications /> : null}
        <Link to="/profile" className="profile-btn">Profile</Link>
      </div>
    </nav>
  );
}

export default Navbar;
