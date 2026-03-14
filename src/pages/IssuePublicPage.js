import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ActivityTimeline from '../components/ActivityTimeline';
import { API_URL } from '../config';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { FaTwitter, FaShareAlt, FaExclamationTriangle, FaMapMarkerAlt, FaCalendarAlt, FaBuilding, FaExclamationCircle } from 'react-icons/fa';
import { getPriorityColor, getStatusColor } from '../utils/helpers';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const IssuePublicPage = () => {
    const { id } = useParams();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchIssue = async () => {
            try {
                const res = await fetch(`${API_URL}/reports/public/${id}`);
                const data = await res.json();
                if (res.ok) {
                    setIssue(data);
                } else {
                    setError('Issue not found or sever error.');
                }
            } catch (err) {
                setError('Failed to connect to server.');
            } finally {
                setLoading(false);
            }
        };
        fetchIssue();
    }, [id]);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'CitySathi Civic Issue',
                text: `Check out this civic issue reported on CitySathi: ${issue?.category?.replace('_', ' ')}`,
                url: window.location.href,
            }).catch(console.error);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );
    
    if (error) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
            <Navbar />
            <div className="flex-grow flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                    <FaExclamationTriangle className="text-amber-500 text-5xl mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800">{error}</h2>
                    <Link to="/" className="mt-4 inline-block text-indigo-600 font-bold hover:underline">Return Home</Link>
                </div>
            </div>
        </div>
    );
    if (!issue) return null;

    const escalateColor = issue.escalationLevel === 3 ? 'bg-red-100 text-red-800 border-red-200' :
                          issue.escalationLevel === 2 ? 'bg-orange-100 text-orange-800 border-orange-200' :
                          issue.escalationLevel === 1 ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          'bg-slate-100 text-slate-600 border-slate-200';

    const twitterShareUrl = `https://twitter.com/intent/tweet?text=Please review this civic issue reported in our city! %23CitySathi %23SmartCity&url=${encodeURIComponent(window.location.href)}`;

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            {/* Minimal Public Navbar variant */}
            <div className="bg-slate-900 border-b border-white/10 shadow-lg">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <Link to="/" className="text-white font-extrabold text-2xl flex items-center gap-2">
                        <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">CitySathi</span>
                    </Link>
                    <div className="text-slate-300 text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Public Portal
                    </div>
                </div>
            </div>

            <main className="flex-grow max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    {/* Header */}
                    <div className="bg-white px-8 py-6 flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    {issue.category?.replace('_', ' ')}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getPriorityColor(issue.priority || 'Medium')}`}>
                                    {issue.priority || 'Medium'} Priority
                                </span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Public Issue Tracker</h1>
                            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2 font-medium">
                                <FaCalendarAlt /> Reported on {new Date(issue.timestamp).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <a 
                                href={twitterShareUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-[#1DA1F2] hover:bg-[#1a91da] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
                            >
                                <FaTwitter /> Tweet
                            </a>
                            <button 
                                onClick={handleShare}
                                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
                            >
                                <FaShareAlt /> Share
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                        {/* Img and Map Column */}
                        <div className="lg:col-span-2 border-r border-slate-100">
                            <div className="w-full h-96 bg-slate-100 relative group">
                                <img src={issue.imageUrl} alt="Civic Issue" className="w-full h-full object-cover" />
                                {issue.escalationLevel > 0 && (
                                    <div className="absolute top-4 left-4 z-10 transition-transform hover:scale-105">
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 shadow-xl backdrop-blur-md font-bold text-sm uppercase tracking-wide ${escalateColor}`}>
                                            <FaExclamationTriangle />
                                            Level {issue.escalationLevel} Escalation
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-8">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Citizen Description</h3>
                                <p className="text-slate-700 bg-slate-50 p-6 rounded-2xl border border-slate-100 text-lg leading-relaxed font-serif italic shadow-sm">
                                    "{issue.description}"
                                </p>

                                <div className="mt-8">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-indigo-500" /> Geolocation Data
                                    </h3>
                                    <p className="text-slate-700 font-medium mb-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 shadow-sm inline-block">
                                        {issue.location?.address || 'Location provided via GPS coordinates'}
                                    </p>
                                    
                                    {issue.location && issue.location.lat && (
                                        <div className="h-72 rounded-2xl overflow-hidden border border-slate-200 shadow-md z-0 relative">
                                            <MapContainer center={[issue.location.lat, issue.location.lng]} zoom={15} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                <Marker position={[issue.location.lat, issue.location.lng]}>
                                                    <Popup>{issue.category?.replace('_', ' ')}</Popup>
                                                </Marker>
                                            </MapContainer>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="p-8 bg-slate-50/50">
                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Accountability Tracking</h3>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-500 font-bold text-xs uppercase tracking-wider text-center">Assigned Department</span>
                                        <span className="flex items-center justify-center gap-2 text-sm font-bold bg-indigo-50 text-indigo-700 px-4 py-3 rounded-xl uppercase border border-indigo-100">
                                            <FaBuilding /> {issue.department || 'General'}
                                        </span>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-1">
                                        <span className="text-slate-500 font-bold text-xs uppercase tracking-wider text-center">Current Status</span>
                                        <div className="flex justify-center mt-1">
                                            <span className={`text-sm tracking-wide font-black px-4 py-2 rounded-xl uppercase shadow-sm ${getStatusColor(issue.status)}`}>
                                                {issue.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Milestone Timeline</h3>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <ActivityTimeline currentStatus={issue.status} />
                                </div>
                            </div>

                            {issue.remarks && (
                                <div className="animate-fadeIn">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FaExclamationCircle className="text-indigo-500" /> Official Response
                                    </h3>
                                    <div className="bg-indigo-600 border border-indigo-700 rounded-2xl p-6 text-white text-sm shadow-lg leading-relaxed relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                        <strong className="block text-indigo-200 uppercase tracking-widest text-[10px] mb-2">Authority Note:</strong>
                                        <p className="relative z-10">{issue.remarks}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </main>
            <Footer />
        </div>
    );
};

export default IssuePublicPage;
