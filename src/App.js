import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ReportPage from './pages/ReportPage';
import UserDashboard from './dashboards/UserDashboard';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';
import MunicipalityDashboard from './dashboards/MunicipalityDashboard';
import NgoDashboard from './dashboards/NgoDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/reports" element={<UserDashboard />} />
        <Route path="/register" element={<RegisterPage />} /> {/* Register route */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path='/about' element={<About />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/municipality"
          element={
            <ProtectedRoute allowedRoles={['municipality']}>
              <MunicipalityDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ngo"
          element={
            <ProtectedRoute allowedRoles={['ngo']}>
              <NgoDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
