import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';

const NotificationBell = ({ notifications = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.read).length);
    }, [notifications]);

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors focus:outline-none"
            >
                <FaBell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full animate-bounce">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-2xl overflow-hidden z-50 border border-gray-100">
                    <div className="py-3 px-4 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-700 font-sans">
                        Notifications
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-6 px-4 text-sm text-gray-500 text-center flex flex-col items-center">
                                <div className="text-4xl mb-2 opacity-50">📭</div>
                                No new notifications
                            </div>
                        ) : (
                            notifications.map((notif, index) => (
                                <div key={index} className={`py-3 px-4 text-sm border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-indigo-50/40 border-l-4 border-l-indigo-500 font-medium' : 'text-gray-600'}`}>
                                    <p className="leading-snug">{notif.message}</p>
                                    <div className="text-xs text-gray-400 mt-1.5 flex items-center">
                                        ⏱️ {notif.time || 'Just now'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
