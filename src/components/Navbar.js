import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import Notifications from './Notifications';
import { FiMenu, FiX, FiUser, FiLogOut } from 'react-icons/fi';
import { jwtDecode } from "jwt-decode";

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  let userRole = 'user';
  let isLoggedIn = false;
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      userRole = decoded.user.role;
      isLoggedIn = true;
    }
  } catch (error) {
    // Invalid token
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    window.location.reload(); // Refresh to update state
  };

  return (
    <nav className="navbar">
      {/* Left Logo */}
      <h2 className="logo" onClick={() => navigate('/')}>CitySathi</h2>

      {/* Hamburger Icon for Mobile */}
      <div className="mobile-menu-icon" onClick={toggleMobileMenu}>
        {isMobileMenuOpen ? <FiX /> : <FiMenu />}
      </div>

      {/* Center Links */}
      <div className={`links ${isMobileMenuOpen ? 'active' : ''}`}>
        <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
        <Link to="/report" onClick={() => setIsMobileMenuOpen(false)}>Report Issue</Link>
        <Link to="/reports" onClick={() => setIsMobileMenuOpen(false)}>Public Reports</Link>
        {isLoggedIn && <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>My Reports</Link>}
        {userRole === 'admin' && <Link to="/admin" className="admin-link" onClick={() => setIsMobileMenuOpen(false)}>Admin Dash</Link>}
        {userRole === 'municipality' && <Link to="/municipality" className="admin-link" onClick={() => setIsMobileMenuOpen(false)}>Muni Dash</Link>}
        {userRole === 'ngo' && <Link to="/ngo" className="admin-link" onClick={() => setIsMobileMenuOpen(false)}>NGO Dash</Link>}
        <Link to="/about" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
        {!isLoggedIn && <Link to="/login" className="login-link" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>}
      </div>

      <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {isLoggedIn && <Notifications />}
        <Link to="/profile" className="profile-btn">
          <FiUser size={20} style={{ marginRight: '5px' }} />
          <span>Profile</span>
        </Link>
        {isLoggedIn && (
           <button onClick={handleLogout} className="logout-btn" title="Logout">
             <FiLogOut size={20} />
           </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
