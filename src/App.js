import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ReportPage from './pages/ReportPage';
import ReportsSection from './pages/ReportsSection';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/reports" element={<ReportsSection />} />
        <Route path="/register" element={<RegisterPage />} /> {/* Register route */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path='/about' element={<About />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
