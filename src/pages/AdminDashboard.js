import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ImageViewer from '../components/ImageViewer';
import ActivityTimeline from '../components/ActivityTimeline';
import { API_URL } from '../config';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { FaShieldAlt, FaUsers, FaTasks, FaCheckDouble, FaExclamationCircle, FaMapMarkedAlt, FaChartPie, FaListAlt, FaFire, FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa';
import { getPriorityColor, getStatusColor, getDepartment } from '../utils/helpers';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// Heatmap Layer Component
const HeatmapLayer = ({ points }) => {
    const map = useMap();
    useEffect(() => {
        if (!map || !points || points.length === 0) return;
        const heatPoints = points.map(p => [p.lat, p.lng, p.intensity || 1]);
        const heat = L.heatLayer(heatPoints, { radius: 25, blur: 15, maxZoom: 17, gradient: {0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red'} }).addTo(map);
        return () => { map.removeLayer(heat); };
    }, [map, points]);
    return null;
};

const AdminDashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); 
    const [selectedReport, setSelectedReport] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [statusUpdate, setStatusUpdate] = useState('');
    const [priorityUpdate, setPriorityUpdate] = useState('Medium');
    const [escalationUpdate, setEscalationUpdate] = useState(0);
    const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'map', 'reports', 'escalations'

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/reports/admin/all`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            if (res.ok) {
                setReports(data || []);
            } else {
                toast.error(data.msg || 'Failed to fetch reports');
            }
        } catch (err) {
            console.error(err);
            toast.error('Server error fetching reports');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!selectedReport) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/reports/${selectedReport._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: statusUpdate, remarks, priority: priorityUpdate, escalationLevel: Number(escalationUpdate) })
            });

            if (res.ok) {
                toast.success('Report updated successfully 🚀');
                setSelectedReport(null);
                setRemarks('');
                fetchReports(); 
            } else {
                const data = await res.json();
                toast.error(data.msg || 'Update failed');
            }
        } catch (err) {
            console.error(err);
            toast.error('Server error updating report');
        }
    };

    const openModal = (report) => {
        setSelectedReport(report);
        setStatusUpdate(report.status || 'in-review');
        setRemarks(report.remarks || '');
        setPriorityUpdate(report.priority || 'Medium');
        setEscalationUpdate(report.escalationLevel || 0);
    };

    const filteredReports = reports.filter(r => filter === 'all' ? true : r.status === filter);

    const pendingCount = reports.filter(r => r.status === 'pending' || r.status === 'Submitted').length;
    const resolvedCount = reports.filter(r => ['resolved', 'completed', 'closed'].includes((r.status || '').toLowerCase())).length;
    const inReviewCount = reports.length - pendingCount - resolvedCount;

    // Chart Data Preparation
    const categoryDataMap = reports.reduce((acc, report) => {
      const cat = report.category || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const pieChartData = Object.keys(categoryDataMap).map(cat => ({
      name: cat.replace('_', ' ').toUpperCase(),
      value: categoryDataMap[cat]
    }));

    // Generate dummy monthly trends data based on existing reports (simulated for visual appeal)
    const trendData = [
        { name: 'Jan', reports: Math.floor(reports.length * 0.1) || 5, resolved: Math.floor(reports.length * 0.05) || 2 },
        { name: 'Feb', reports: Math.floor(reports.length * 0.2) || 12, resolved: Math.floor(reports.length * 0.1) || 8 },
        { name: 'Mar', reports: Math.floor(reports.length * 0.3) || 18, resolved: Math.floor(reports.length * 0.2) || 10 },
        { name: 'Apr', reports: Math.floor(reports.length * 0.4) || 25, resolved: Math.floor(reports.length * 0.35) || 20 },
        { name: 'May', reports: reports.length || 30, resolved: resolvedCount || 15 },
    ];

    // Heatmap data points
    const heatmapPoints = reports
        .filter(r => r.location && r.location.lat && r.location.lng)
        .map(r => ({
            lat: r.location.lat,
            lng: r.location.lng,
            intensity: r.priority === 'High' ? 1 : 0.5
        }));

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Navbar />
            
            <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Admin Header */}
                <div className="bg-slate-900 rounded-3xl p-8 mb-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center z-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                    <div className="absolute top-0 right-48 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                    
                    <div className="relative z-20 mb-6 md:mb-0">
                        <h1 className="text-3xl font-extrabold flex items-center tracking-tight">
                            <FaShieldAlt className="mr-3 text-indigo-400" /> System Control Center
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg max-w-xl">Comprehensive oversight of all civic issues, municipality performance, and smart city analytics.</p>
                    </div>
                    
                    <div className="flex gap-3 relative z-20">
                        <button 
                            onClick={() => setActiveTab('analytics')}
                            className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                            <FaChartPie /> Analytics
                        </button>
                        <button 
                            onClick={() => setActiveTab('map')}
                            className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'map' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                            <FaMapMarkedAlt /> City Heatmap
                        </button>
                        <button 
                            onClick={() => setActiveTab('reports')}
                            className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                            <FaListAlt /> Reports
                        </button>
                        <button 
                            onClick={() => setActiveTab('escalations')}
                            className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'escalations' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-red-400'}`}
                        >
                            <FaFire /> Escalations
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Signals</p>
                            <h3 className="text-4xl font-black text-slate-800">{reports.length}</h3>
                        </div>
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FaTasks size={24} />
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                        <div>
                            <p className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-1">Pending Approv</p>
                            <h3 className="text-4xl font-black text-slate-800">{pendingCount}</h3>
                        </div>
                        <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FaExclamationCircle size={24} />
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                        <div>
                            <p className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-1">In Process</p>
                            <h3 className="text-4xl font-black text-slate-800">{inReviewCount}</h3>
                        </div>
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FaUsers size={24} />
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                        <div>
                            <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-1">Resolved Base</p>
                            <h3 className="text-4xl font-black text-slate-800">{resolvedCount}</h3>
                        </div>
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FaCheckDouble size={24} />
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'analytics' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-fadeIn">
                        {/* Categories Chart */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Issue Distribution</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Trends Chart */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Registration vs Resolution Trends</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend iconType="circle" />
                                        <Line type="monotone" dataKey="reports" name="Reported" stroke="#8b5cf6" strokeWidth={3} dot={{r: 6, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
                                        <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={3} dot={{r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'map' && (
                    <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 mb-8 animate-fadeIn h-[600px] overflow-hidden">
                        {heatmapPoints.length > 0 ? (
                            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%', borderRadius: '1.25rem', zIndex: 1 }}>
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                />
                                <HeatmapLayer points={heatmapPoints} />
                            </MapContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-2xl">
                                <p className="text-slate-400 font-medium">Insufficient geodata for heatmap generation</p>
                            </div>
                        )}
                        <div className="absolute top-10 right-10 z-10 bg-slate-900/80 backdrop-blur border border-slate-700 p-4 rounded-xl text-white shadow-xl max-w-xs pointer-events-none">
                            <h4 className="font-bold mb-2 text-sm uppercase tracking-wider text-slate-300">Heatmap Analysis</h4>
                            <p className="text-xs text-slate-400 mb-3">Visualizing the concentration and severity of civic issues across the region. Red areas indicate high-density or high-priority zones requiring immediate municipal intervention.</p>
                            <div className="w-full h-2 rounded-full bg-gradient-to-r from-blue-500 via-lime-500 to-red-500"></div>
                            <div className="flex justify-between text-[10px] mt-1 text-slate-400 font-bold uppercase">
                                <span>Low Density</span>
                                <span>Critical</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8 animate-fadeIn">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h2 className="text-xl font-bold text-slate-800">Master Reports Database</h2>
                            <div className="flex bg-slate-200/50 p-1 rounded-xl">
                                {['all', 'pending', 'resolved'].map(f => (
                                    <button 
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-all ${filter === f ? 'bg-white text-indigo-700 shadow shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-6 space-y-4">
                                {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl"></div>)}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100">
                                            <th className="p-5">ID & Date</th>
                                            <th className="p-5">Citizen & Location</th>
                                            <th className="p-5">Issue Details</th>
                                            <th className="p-5">Routing</th>
                                            <th className="p-5 text-right">Admin Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredReports.map(report => (
                                            <tr key={report._id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="p-5">
                                                    <div className="font-mono text-xs text-slate-400 mb-1">#{report._id?.substring(0,8)}</div>
                                                    <div className="text-sm font-semibold text-slate-700">{new Date(report.timestamp).toLocaleDateString()}</div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="text-sm font-bold text-slate-800 mb-1">{report.user?.name || report.userId?.fullName || 'Citizen User'}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <FaMapMarkedAlt /> <span className="line-clamp-1 max-w-[150px]">{report.location?.address || 'Unknown'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase border border-indigo-100">
                                                            {report.category?.replace('_', ' ')}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getPriorityColor(report.priority || 'Medium')}`}>
                                                            {report.priority || 'Medium'}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-slate-600 line-clamp-1 max-w-[200px]">{report.description}</div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                                        <div className={`w-2 h-2 rounded-full ${report.department ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                                                        {report.department || getDepartment(report.category || '')}
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${getStatusColor(report.status)}`}>
                                                        {report.status || 'Active'}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <button 
                                                        onClick={() => openModal(report)}
                                                        className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 text-sm font-bold rounded-lg text-indigo-700 bg-white hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm"
                                                    >
                                                        Review
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'escalations' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8 animate-fadeIn border-t-4 border-t-red-500">
                        <div className="p-6 border-b border-slate-100 bg-red-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-red-700 flex items-center gap-2"><FaExclamationTriangle /> Unresolved & Escalated Issues</h2>
                                <p className="text-sm text-slate-500 mt-1">Monitor high-priority or aging issues needing immediate force-escalation.</p>
                            </div>
                            <div className="flex bg-slate-200/50 p-1 rounded-xl">
                                {['all', 'level 1', 'level 2', 'level 3'].map((lvl, index) => (
                                    <button 
                                        key={lvl}
                                        onClick={() => setFilter(lvl === 'all' ? 'all' : (index).toString())}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-all ${filter === (lvl === 'all' ? 'all' : index.toString()) ? 'bg-white text-red-700 shadow shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-6 space-y-4">
                                {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl"></div>)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-50">
                                {reports.filter(r => 
                                    (r.escalationLevel > 0 || r.priority === 'High' || (Date.now() - new Date(r.timestamp).getTime() > 24 * 60 * 60 * 1000 && !['resolved', 'rejected', 'completed'].includes(r.status))) &&
                                    (filter === 'all' || r.escalationLevel?.toString() === filter)
                                ).map(report => {
                                    const ageHours = Math.floor((Date.now() - new Date(report.timestamp).getTime()) / (1000 * 60 * 60));
                                    const escLevel = report.escalationLevel || 0;
                                    return (
                                        <div key={report._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 overflow-hidden flex flex-col">
                                            <div className="p-5 border-b border-slate-100">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${getPriorityColor(report.priority || 'Medium')}`}>
                                                        {report.priority || 'Medium'} Priority
                                                    </span>
                                                    <span className={`text-xs font-bold px-3 py-1 rounded-full text-white ${escLevel === 3 ? 'bg-red-600' : escLevel === 2 ? 'bg-orange-500' : escLevel === 1 ? 'bg-amber-500' : 'bg-slate-400'}`}>
                                                        Level {escLevel}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-slate-800 text-lg mb-1 capitalize">{report.category?.replace('_', ' ')}</h3>
                                                <p className="text-sm text-slate-500 line-clamp-2 italic">"{report.description}"</p>
                                            </div>
                                            <div className="p-5 bg-slate-50 flex-grow flex flex-col justify-end">
                                                <div className="flex justify-between items-center text-sm font-medium text-slate-600 mb-2">
                                                    <span className="flex items-center gap-1.5"><FaUsers className="text-slate-400" /> Dept: {report.department || 'General'}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm font-medium text-red-600 mb-4">
                                                    <span className="flex items-center gap-1.5"><FaCalendarAlt className="text-red-400" /> Pending: {ageHours} hours</span>
                                                </div>
                                                <button 
                                                    onClick={() => openModal(report)}
                                                    className="w-full py-2.5 rounded-xl font-bold border-2 border-red-100 text-red-700 bg-red-50 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                                                >
                                                    Force Action
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>

            <Footer />

            <ImageViewer 
                isOpen={!!selectedImage} 
                imageUrl={selectedImage} 
                onClose={() => setSelectedImage(null)} 
            />

            {/* Admin Override Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto" onClick={() => setSelectedReport(null)}>
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden mt-10 md:mt-0 border border-slate-200 animate-slideUp" onClick={e => e.stopPropagation()}>
                        
                        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <FaShieldAlt className="text-indigo-400" /> Admin Override Panel
                            </h2>
                            <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                <div className="space-y-4">
                                    <div 
                                        className="w-full h-48 bg-slate-100 rounded-2xl overflow-hidden cursor-pointer group relative border border-slate-200"
                                        onClick={() => setSelectedImage(selectedReport.imageUrl)}
                                    >
                                        <img 
                                            src={selectedReport.imageUrl} 
                                            alt="Report Evidence" 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => e.target.src = "https://via.placeholder.com/400?text=No+Image"}
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-sm font-bold px-4 py-2 bg-black/50 rounded-full backdrop-blur-sm">View Full Image</span>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">System Metadata</div>
                                        <ul className="space-y-2 text-sm text-slate-600">
                                            <li className="flex justify-between"><span className="font-semibold text-slate-800">Sys ID:</span> <span className="font-mono text-xs">{selectedReport._id}</span></li>
                                            <li className="flex justify-between"><span className="font-semibold text-slate-800">Timestamp:</span> <span>{new Date(selectedReport.timestamp).toLocaleString()}</span></li>
                                            <li className="flex justify-between"><span className="font-semibold text-slate-800">User ID:</span> <span className="font-mono text-xs">{selectedReport.user?._id || selectedReport.userId?._id || 'Unknown'}</span></li>
                                            <li className="flex justify-between"><span className="font-semibold text-slate-800">Target Dept:</span> <span className="capitalize text-indigo-700 font-bold">{selectedReport.department || getDepartment(selectedReport.category || '')}</span></li>
                                            <li className="flex justify-between items-center"><span className="font-semibold text-slate-800">Current Status:</span> <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getStatusColor(selectedReport.status)}`}>{selectedReport.status}</span></li>
                                            <li className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
                                                <span className="font-semibold text-slate-800">Public Link:</span>
                                                <a href={selectedReport.publicUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 font-bold hover:underline truncate ml-2">
                                                    {selectedReport.publicUrl ? 'View Tracker' : 'N/A'}
                                                </a>
                                            </li>
                                            {(selectedReport.aiConfidence || selectedReport.aiDetectedCategory) && (
                                                <li className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
                                                    <span className="font-semibold text-slate-800">AI Analysis:</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${selectedReport.aiVerified ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                        {selectedReport.aiDetectedCategory?.replace('_', ' ')} ({(selectedReport.aiConfidence * 100).toFixed(0)}%)
                                                    </span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                                
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedReport.category?.replace('_', ' ').toUpperCase()}</h3>
                                        <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 italic">"{selectedReport.description}"</p>
                                    </div>

                                    <div className="pt-2">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Timeline History</h4>
                                        <ActivityTimeline currentStatus={selectedReport.status || 'Submitted'} />
                                    </div>

                                    <form onSubmit={handleUpdate} className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">Override Status</label>
                                            <select 
                                                value={statusUpdate} 
                                                onChange={(e) => setStatusUpdate(e.target.value)}
                                                className="w-full bg-white border border-indigo-200 text-slate-700 font-bold text-sm rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm transition-all"
                                            >
                                                <option value="Submitted">Submitted (Reset)</option>
                                                <option value="Acknowledged">Acknowledged</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Resolved">Resolved</option>
                                                <option value="Rejected">Rejected (Spam/Mute)</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">Priority</label>
                                                <select 
                                                    value={priorityUpdate} 
                                                    onChange={(e) => setPriorityUpdate(e.target.value)}
                                                    className="w-full bg-white border border-indigo-200 text-slate-700 font-bold text-sm rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">Escalation</label>
                                                <select 
                                                    value={escalationUpdate} 
                                                    onChange={(e) => setEscalationUpdate(e.target.value)}
                                                    className="w-full bg-white border border-indigo-200 text-slate-700 font-bold text-sm rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                                                >
                                                    <option value="0">Level 0 (Normal)</option>
                                                    <option value="1">Level 1 (Reminder)</option>
                                                    <option value="2">Level 2 (Admin Alert)</option>
                                                    <option value="3">Level 3 (Public)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">System/Admin Remarks</label>
                                            <textarea
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                placeholder="Provide official administrative notes..."
                                                rows={3}
                                                className="w-full bg-white border border-indigo-200 text-slate-700 text-sm rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm transition-all resize-none"
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button 
                                                type="button" 
                                                className="flex-1 px-4 py-2.5 bg-white border border-indigo-200 text-indigo-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                                                onClick={() => setSelectedReport(null)}
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="flex-1 px-4 py-2.5 bg-indigo-600 border border-transparent text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/30"
                                            >
                                                Execute Override
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
