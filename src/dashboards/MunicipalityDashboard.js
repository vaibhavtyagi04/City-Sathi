import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { FaCity, FaExclamationTriangle, FaCheckCircle, FaClock, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ImageViewer from '../components/ImageViewer';
import ActivityTimeline from '../components/ActivityTimeline';
import { API_URL } from '../config';
import { getPriorityColor, getStatusColor } from '../utils/helpers';

const MunicipalityDashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
    const [selectedReport, setSelectedReport] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [reviewRemarks, setReviewRemarks] = useState('');
    const [reviewStatus, setReviewStatus] = useState('');
    const [userDept, setUserDept] = useState('');

    useEffect(() => {
        fetchDepartmentReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDepartmentReports = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/reports/dept/assigned`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            if (res.ok) {
                setReports(data || []);
                calculateStats(data || []);
                if (data && data.length > 0) setUserDept(data[0].department || 'General');
            } else {
                toast.error(data.msg || 'Failed to fetch reports');
            }
        } catch (error) {
            toast.error('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const total = data.length;
        const resolved = data.filter(r => ['resolved', 'closed', 'completed'].includes((r.status || '').toLowerCase())).length;
        const pending = total - resolved;
        setStats({ total, pending, resolved });
    };

    const openModal = (report) => {
        setSelectedReport(report);
        setReviewStatus(report.status || 'Acknowledged');
        setReviewRemarks(report.remarks || '');
        setShowModal(true);
    };

    const handleUpdateStatus = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/reports/${selectedReport._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: reviewStatus, remarks: reviewRemarks })
            });

            if (res.ok) {
                toast.success('Report updated successfully');
                setShowModal(false);
                fetchDepartmentReports();
            } else {
                const data = await res.json();
                toast.error(data.msg || 'Update failed');
            }
        } catch (error) {
            toast.error('Server error');
        }
    };

    const chartData = [
        { name: 'In Progress', value: stats.pending, color: '#f59e0b' },
        { name: 'Resolved', value: stats.resolved, color: '#10b981' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar />
            
            <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Municipality Dashboard</h1>
                        <p className="text-gray-500 mt-1">Manage infrastructure, resolve issues, and ensure civic code.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-indigo-50 text-indigo-700 px-6 py-3 rounded-xl border border-indigo-100 shadow-sm">
                        <FaCity size={24} />
                        <div>
                            <div className="text-xs uppercase tracking-wider font-bold opacity-70">Department</div>
                            <div className="text-lg font-bold">{userDept ? userDept.toUpperCase() : 'MUNICIPALITY'}</div>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <div className="text-gray-500 font-medium text-sm uppercase tracking-wide">Total Assigned</div>
                            <div className="mt-2 text-4xl font-bold text-gray-900">{stats.total}</div>
                        </div>
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                            <FaExclamationTriangle size={28} />
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <div className="text-yellow-600 font-medium text-sm uppercase tracking-wide">In Progress</div>
                            <div className="mt-2 text-4xl font-bold text-yellow-900">{stats.pending}</div>
                        </div>
                        <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-2xl flex items-center justify-center">
                            <FaClock size={28} />
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <div className="text-green-600 font-medium text-sm uppercase tracking-wide">Resolved</div>
                            <div className="mt-2 text-4xl font-bold text-green-900">{stats.resolved}</div>
                        </div>
                        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                            <FaCheckCircle size={28} />
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    
                    {/* Left Col: Table */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-xl font-bold text-gray-800">Assigned Complaints</h2>
                                <span className="text-sm text-gray-500">{reports.length} pending actions</span>
                            </div>
                            
                            {loading ? (
                                <div className="p-6 space-y-4">
                                    {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>)}
                                </div>
                            ) : reports.length === 0 ? (
                                <div className="p-16 text-center text-gray-500">
                                    <FaCheckCircle className="mx-auto text-4xl text-green-200 mb-3" />
                                    <p>No complaints assigned to your department currently.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                                <th className="p-4">Image</th>
                                                <th className="p-4">Details</th>
                                                <th className="p-4 hidden sm:table-cell">Status</th>
                                                <th className="p-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {reports.map((report) => (
                                                <tr key={report._id} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="p-4 w-24">
                                                        <div 
                                                            className="w-16 h-16 rounded-lg bg-gray-200 cursor-pointer overflow-hidden border border-gray-200"
                                                            onClick={() => setSelectedImage(report.imageUrl)}
                                                        >
                                                            <img 
                                                                src={report.imageUrl} 
                                                                alt="proof" 
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                                onError={(e) => e.target.src = "https://via.placeholder.com/150"}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                                                                {report.category?.replace('_', ' ')}
                                                            </span>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getPriorityColor(report.priority || 'Medium')}`}>
                                                                {report.priority || 'Medium'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{report.description}</p>
                                                        <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                                                            <span className="flex items-center"><FaMapMarkerAlt className="mr-1 mt-0.5 text-gray-400" /> {report.location?.address || report.location?.city || 'Not specified'}</span>
                                                            <span className="flex items-center"><FaCalendarAlt className="mr-1 text-gray-400" /> {new Date(report.timestamp).toLocaleDateString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 hidden sm:table-cell">
                                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wide ${getStatusColor(report.status)}`}>
                                                            {report.status || 'Submitted'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button 
                                                            onClick={() => openModal(report)}
                                                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                                        >
                                                            Resolve Issue
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Col: Analytics */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">Resolution Overview</h2>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl shadow-sm p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                            <h3 className="text-lg font-bold mb-3 relative z-10 flex items-center">Officer Guidelines <span className="ml-2 text-2xl">📋</span></h3>
                            <ul className="text-indigo-100 text-sm space-y-3 relative z-10">
                                <li className="flex items-start"><span className="mr-2 font-bold bg-white/20 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">1</span> Review all High Priority issues first.</li>
                                <li className="flex items-start"><span className="mr-2 font-bold bg-white/20 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">2</span> Upload a clear "Fix Proof" image when marking an issue as Resolved.</li>
                                <li className="flex items-start"><span className="mr-2 font-bold bg-white/20 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">3</span> Engage with citizens properly in the remarks section.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <ImageViewer 
                isOpen={!!selectedImage} 
                imageUrl={selectedImage} 
                onClose={() => setSelectedImage(null)} 
            />

            {/* Complaint Details Modal */}
            {showModal && selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-75 overflow-y-auto backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden mt-10 md:mt-0" onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                <span className={`w-3 h-3 rounded-full mr-2 ${selectedReport.priority === 'High' ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`}></span>
                                Action Required
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Issue Overview</h4>
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full uppercase">
                                                {selectedReport.category?.replace('_', ' ')}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${getPriorityColor(selectedReport.priority || 'Medium')}`}>
                                                {selectedReport.priority || 'Medium'}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-800 mb-3">{selectedReport.description}</p>
                                        <div className="text-xs text-gray-500 flex flex-col gap-1.5">
                                            <span className="flex items-center"><FaMapMarkerAlt className="mr-1.5 text-gray-400" /> {selectedReport.location?.address || 'Location unknown'}</span>
                                            <span className="flex items-center"><FaCalendarAlt className="mr-1.5 text-gray-400" /> {new Date(selectedReport.timestamp).toLocaleString()}</span>
                                            <span className="flex items-center">👤 Reporter: {selectedReport.user?.name || 'Citizen'}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Issue Proof</h4>
                                    <div 
                                        className="w-full h-40 bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden cursor-pointer group relative"
                                        onClick={() => setSelectedImage(selectedReport.imageUrl)}
                                    >
                                        <img 
                                            src={selectedReport.imageUrl} 
                                            alt="Complaint Proof" 
                                            className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                                            onError={(e) => e.target.src = "https://via.placeholder.com/300?text=No+Image"}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <span className="bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full">Expand Image</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline integration */}
                            <div className="mb-8 pt-4 border-t border-gray-100">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Current Status Tracking:</h4>
                                <ActivityTimeline currentStatus={reviewStatus} />
                            </div>

                            <div className="space-y-5 bg-indigo-50/50 p-5 rounded-xl border border-indigo-50">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Update Status Segment:</label>
                                    <select 
                                        value={reviewStatus} 
                                        onChange={(e) => setReviewStatus(e.target.value)}
                                        className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-sm font-medium bg-white"
                                    >
                                        <option value="Submitted">Submitted (Awaiting Action)</option>
                                        <option value="Acknowledged">Acknowledged (Seen by Dept)</option>
                                        <option value="In Progress">In Progress (Work ongoing)</option>
                                        <option value="Resolved">Resolved (Work completed)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Public Officer Remarks:</label>
                                    <textarea 
                                        value={reviewRemarks}
                                        onChange={(e) => setReviewRemarks(e.target.value)}
                                        placeholder="Explain the work done or reason for delay..."
                                        rows={3}
                                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 resize-none bg-white"
                                    />
                                    <p className="mt-1.5 text-xs text-gray-500 text-right">Visible to the citizen</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleUpdateStatus}
                                className="px-4 py-2 bg-indigo-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MunicipalityDashboard;
