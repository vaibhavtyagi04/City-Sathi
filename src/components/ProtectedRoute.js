import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" />;
    }

    try {
        const decoded = jwtDecode(token);
        const userRole = decoded.user.role;

        if (!allowedRoles.includes(userRole)) {
            // Redirect to their respective dashboard if they try to access a restricted one
            if (userRole === 'admin') return <Navigate to="/admin" />;
            if (userRole === 'municipality') return <Navigate to="/municipality" />;
            if (userRole === 'ngo') return <Navigate to="/ngo" />;
            return <Navigate to="/" />;
        }
    } catch (err) {
        localStorage.removeItem('token');
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute;
