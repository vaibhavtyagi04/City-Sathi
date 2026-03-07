import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" />;
    }

    try {
        const decoded = jwtDecode(token);
        if (decoded.user.role !== 'admin') {
            return <Navigate to="/" />;
        }
    } catch (err) {
        localStorage.removeItem('token');
        return <Navigate to="/login" />;
    }

    return children;
};

export default AdminRoute;
