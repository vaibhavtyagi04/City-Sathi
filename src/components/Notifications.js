import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import './Notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch(`${API_URL}/notifications`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            if (res.ok) {
                setNotifications(data);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'x-auth-token': token }
            });
            // Update local state
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/notifications/mark-all-read`, {
                method: 'PUT',
                headers: { 'x-auth-token': token }
            });
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="notifications-container">
            <button className="bell-btn" onClick={() => setIsOpen(!isOpen)}>
                🔔
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notifications-dropdown">
                    <div className="dropdown-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && <button onClick={markAllRead} className="mark-all-btn">Mark all read</button>}
                    </div>

                    <div className="notifications-list">
                        {loading ? <p className="loading">Loading...</p> : (
                            notifications.length === 0 ? <p className="no-notifs">No notifications</p> : (
                                notifications.map(n => (
                                    <div key={n._id} className={`notification-item ${n.isRead ? 'read' : 'unread'}`} onClick={() => markAsRead(n._id)}>
                                        <p>{n.message}</p>
                                        <span className="time">{new Date(n.createdAt).toLocaleDateString()}</span>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;
