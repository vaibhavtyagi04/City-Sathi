import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_URL } from "../config";
import ImageViewer from "../components/ImageViewer";
import ActivityTimeline from "../components/ActivityTimeline";
import MapFilter from "../components/MapFilter";
import LiveMap from "../components/LiveMap";
import { getPriorityColor, getStatusColor } from "../utils/helpers";
import { FaPlusCircle, FaMapMarkerAlt, FaCalendarAlt, FaListUl, FaMap } from 'react-icons/fa';

export default function UserDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'map'
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location?.state?.filter) {
      setFilter(location.state.filter);
    }
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const fetchReports = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/reports/user`, {
        headers: { 'x-auth-token': token }
      });
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      setReports(data || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  const isResolved = (r) => ['resolved', 'closed', 'completed'].includes((r?.status || "").toLowerCase());
  
  const stats = {
    total: reports.length,
    resolved: reports.filter(isResolved).length,
    pending: reports.filter(r => !isResolved(r)).length
  };

  const filteredReports = reports.filter((r) => {
    if (filter === "All") return true;
    if (filter.toLowerCase() === "resolved") return isResolved(r);
    if (filter.toLowerCase() === "pending") return !isResolved(r);
    return r.category?.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome back 👋</h1>
                <p className="text-gray-500 mt-1">Track your civic contributions and local issues here.</p>
            </div>
            <Link 
                to="/report" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <FaPlusCircle className="mr-2" /> Report New Issue
            </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div 
                className={`bg-white rounded-2xl p-6 shadow-sm border-2 cursor-pointer transition-all ${filter === 'All' ? 'border-indigo-500 scale-[1.02]' : 'border-gray-100 hover:border-gray-200'}`}
                onClick={() => {setFilter('All'); setViewMode('list');}}
            >
                <div className="text-gray-500 font-medium text-sm uppercase tracking-wide">Total Reports</div>
                <div className="mt-2 text-4xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div 
                className={`bg-yellow-50 rounded-2xl p-6 shadow-sm border-2 cursor-pointer transition-all ${filter === 'pending' ? 'border-yellow-500 scale-[1.02]' : 'border-yellow-100 hover:border-yellow-200'}`}
                onClick={() => {setFilter('pending'); setViewMode('list');}}
            >
                <div className="text-yellow-700 font-medium text-sm uppercase tracking-wide">In Progress</div>
                <div className="mt-2 text-4xl font-bold text-yellow-900">{stats.pending}</div>
            </div>
            <div 
                className={`bg-green-50 rounded-2xl p-6 shadow-sm border-2 cursor-pointer transition-all ${filter === 'resolved' ? 'border-green-500 scale-[1.02]' : 'border-green-100 hover:border-green-200'}`}
                onClick={() => {setFilter('resolved'); setViewMode('list');}}
            >
                <div className="text-green-700 font-medium text-sm uppercase tracking-wide">Resolved</div>
                <div className="mt-2 text-4xl font-bold text-green-900">{stats.resolved}</div>
            </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-gray-100 gap-4 bg-gray-50/50">
                <div className="flex bg-gray-200/50 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-indigo-700 shadow pl-3' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <FaListUl className="mr-2" /> My Complaints
                    </button>
                    <button 
                        onClick={() => setViewMode('map')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-white text-indigo-700 shadow pl-3' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <FaMap className="mr-2" /> Live City Map
                    </button>
                </div>
                {viewMode === 'list' && (
                    <MapFilter currentFilter={filter} setFilter={setFilter} />
                )}
            </div>

            <div className="p-6 md:p-8">
                {viewMode === 'map' ? (
                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                        <LiveMap />
                    </div>
                ) : (
                    <>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="animate-pulse bg-gray-100 h-64 rounded-xl"></div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="text-center py-10 bg-red-50 text-red-600 rounded-xl font-medium">{error}</div>
                        ) : filteredReports.length === 0 ? (
                            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <div className="text-5xl mb-4 opacity-50">📋</div>
                                <h3 className="text-lg font-medium text-gray-900">No reports found</h3>
                                <p className="text-gray-500 mt-1">Looks like you don't have any complaints matching this filter.</p>
                                <button onClick={() => setFilter('All')} className="mt-4 text-indigo-600 font-medium hover:underline">View All Reports</button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {filteredReports.map((report) => (
                                    <div key={report._id} className="flex flex-col lg:flex-row bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                                        
                                        {/* Image Section */}
                                        <div className="w-full lg:w-56 h-48 lg:h-auto relative cursor-pointer overflow-hidden flex-shrink-0 bg-gray-100" onClick={() => setSelectedImage(report.imageUrl)}>
                                            <img 
                                                src={report.imageUrl} 
                                                alt="issue" 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => e.target.src = "https://via.placeholder.com/300?text=No+Image"}
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                                <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">View Reference</span>
                                            </div>
                                        </div>

                                        {/* Details Section */}
                                        <div className="p-5 md:p-6 flex flex-col flex-grow">
                                            <div className="flex flex-wrap justify-between items-start mb-3 gap-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md uppercase tracking-wider ${getStatusColor(report.status)}`}>
                                                        {report.status || "Submitted"}
                                                    </span>
                                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getPriorityColor(report.priority || 'Medium')}`}>
                                                        {report.priority || "Medium"} Priority
                                                    </span>
                                                </div>
                                                <span className="text-xs font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                                    {report.category?.replace('_', ' ')}
                                                </span>
                                            </div>
                                            
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">{report.description}</h3>
                                            
                                            <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-5 gap-y-2 mb-4 font-medium">
                                                <span className="flex items-center"><FaMapMarkerAlt className="mr-1.5 text-gray-400" /> {report.location?.city || 'Local Area'}</span>
                                                <span className="flex items-center"><FaCalendarAlt className="mr-1.5 text-gray-400" /> {new Date(report.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric'})}</span>
                                            </div>

                                            {/* Timeline Section */}
                                            <div className="mt-auto pt-4 border-t border-gray-100">
                                                <ActivityTimeline currentStatus={report.status || 'Submitted'} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
      </main>
      
      <Footer />
      <ImageViewer 
          isOpen={!!selectedImage} 
          imageUrl={selectedImage} 
          onClose={() => setSelectedImage(null)} 
      />
    </div>
  );
}
