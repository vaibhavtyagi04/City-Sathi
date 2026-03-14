import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaHandsHelping, FaPaw, FaTrash, FaCheckCircle, FaMapMarkerAlt, FaStar, FaMap, FaListUl, FaCalendarAlt, FaTree, FaTools } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LiveMap from '../components/LiveMap';
import MapFilter from '../components/MapFilter';
import ImageViewer from '../components/ImageViewer';
import { API_URL } from '../config';
import { getPriorityColor, getStatusColor } from '../utils/helpers';

const NgoDashboard = () => {
    const [availableReports, setAvailableReports] = useState([]);
    const [myClaims, setMyClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
    const [filter, setFilter] = useState('All');
    const [selectedImage, setSelectedImage] = useState(null);
    const [volunteerScore, setVolunteerScore] = useState(0);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        const token = localStorage.getItem('token');
        try {
            setLoading(true);
            const availRes = await fetch(`${API_URL}/reports/ngo/available`, {
                headers: { 'x-auth-token': token }
            });
            const availData = await availRes.json();
            
            const allRes = await fetch(`${API_URL}/reports/admin/all`, { 
                headers: { 'x-auth-token': token }
            });
            const allData = await allRes.json();
            
            if (availRes.ok) setAvailableReports(availData || []);
            if (allRes.ok) {
                const userId = JSON.parse(atob(token.split('.')[1])).user.id;
                const claims = (allData || []).filter(r => r.assignedTo?._id === userId || r.assignedTo === userId);
                setMyClaims(claims);
                
                // Calculate Score (10 pts per resolved)
                const resolvedCount = claims.filter(c => ['resolved', 'completed'].includes((c.status || '').toLowerCase())).length;
                setVolunteerScore(resolvedCount * 10);
            }
        } catch (error) {
            toast.error('Failed to sync with server');
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (reportId) => {
        const token = localStorage.getItem('token');
        const userId = JSON.parse(atob(token.split('.')[1])).user.id;
        try {
            const res = await fetch(`${API_URL}/reports/${reportId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ assignedTo: userId, status: 'in-review' })
            });

            if (res.ok) {
                toast.success('Issue claimed! Happy volunteering. 🌟');
                fetchReports();
            } else {
                toast.error('Claim failed');
            }
        } catch (error) {
            toast.error('Server error');
        }
    };

    const handleResolve = async (reportId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/reports/${reportId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: 'resolved', remarks: 'Resolved by NGO Volunteer' })
            });

            if (res.ok) {
                toast.success('Congratulations! You made a difference. 🎉');
                fetchReports();
            }
        } catch (error) {
            toast.error('Server error');
        }
    };

    const getIcon = (cat) => {
        const category = cat?.toLowerCase() || '';
        if (category.includes('animal') || category.includes('stray')) return <FaPaw className="text-orange-500" />;
        if (category.includes('garbage') || category.includes('waste')) return <FaTrash className="text-red-500" />;
        if (category.includes('tree') || category.includes('plant')) return <FaTree className="text-green-500" />;
        if (category.includes('road') || category.includes('pothole')) return <FaTools className="text-gray-500" />;
        return <FaHandsHelping className="text-indigo-500" />;
    };

    const filteredAvailable = availableReports.filter((r) => {
        if (filter === "All") return true;
        return r.category?.toLowerCase().includes(filter.toLowerCase());
    });

    const activeClaims = myClaims.filter(c => !['resolved', 'completed'].includes((c.status || '').toLowerCase()));
    const resolvedClaims = myClaims.filter(c => ['resolved', 'completed'].includes((c.status || '').toLowerCase()));

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar />
            
            <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Container */}
                <div className="flex flex-col lg:flex-row gap-6 mb-8">
                    {/* Welcome Header */}
                    <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-orange-50 rounded-full opacity-50"></div>
                        <div className="absolute bottom-0 left-10 w-24 h-24 bg-indigo-50 rounded-full opacity-50 blur-xl"></div>
                        <div className="relative z-10">
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2 flex items-center">
                                NGO Volunteer Portal <FaHandsHelping className="ml-3 text-indigo-500" />
                            </h1>
                            <p className="text-gray-500 text-lg">Harnessing community power, one resolution at a time.</p>
                        </div>
                    </div>

                    {/* Stats Highlights */}
                    <div className="lg:w-1/3 grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-3xl text-white shadow-sm flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 text-white/20 -mt-2 -mr-2"><FaStar size={80} /></div>
                            <h3 className="text-indigo-100 font-medium text-sm uppercase tracking-wider relative z-10">Volunteer Score</h3>
                            <div className="text-5xl font-extrabold mt-1 relative z-10">{volunteerScore}</div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center">
                            <h3 className="text-gray-400 font-medium text-sm uppercase tracking-wider mb-3">My Impact</h3>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-600 font-medium text-sm">Active:</span>
                                <span className="text-gray-900 font-bold">{activeClaims.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 font-medium text-sm">Resolved:</span>
                                <span className="text-green-600 font-bold">{resolvedClaims.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                    
                    {/* Left/Main Column: Available Issues */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            
                            {/* Toolbar */}
                            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">Community Issues Tracker</h2>
                                    <p className="text-sm text-gray-500">Discover and claim local issues that need volunteer attention.</p>
                                </div>
                                <div className="flex bg-gray-200/50 p-1 rounded-xl">
                                    <button 
                                        onClick={() => setViewMode('list')}
                                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'list' ? 'bg-white text-indigo-700 shadow pl-3' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <FaListUl className="mr-2" /> List
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('map')}
                                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'map' ? 'bg-white text-indigo-700 shadow pl-3' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <FaMap className="mr-2" /> Map View
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                {viewMode === 'list' && (
                                    <div className="mb-6"><MapFilter currentFilter={filter} setFilter={setFilter} /></div>
                                )}

                                {viewMode === 'map' ? (
                                    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                                        <LiveMap />
                                    </div>
                                ) : (
                                    <>
                                        {loading ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {[...Array(4)].map((_, i) => <div key={i} className="animate-pulse bg-gray-100 h-64 rounded-2xl"></div>)}
                                            </div>
                                        ) : filteredAvailable.length === 0 ? (
                                            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                                <div className="text-5xl mb-4 opacity-50 justify-center flex"><FaCheckCircle className="text-green-500" /></div>
                                                <h3 className="text-xl font-bold text-gray-900">All clear!</h3>
                                                <p className="text-gray-500 mt-2">No community issues available to claim right now.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {filteredAvailable.map(report => (
                                                    <div key={report._id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden group">
                                                        <div className="h-48 relative overflow-hidden bg-gray-100 cursor-pointer" onClick={() => setSelectedImage(report.imageUrl)}>
                                                            <img 
                                                                src={report.imageUrl} 
                                                                alt="issue cover" 
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                onError={(e) => e.target.src = "https://via.placeholder.com/400"}
                                                            />
                                                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-gray-800 flex items-center shadow-sm">
                                                                <span className="mr-1.5">{getIcon(report.category)}</span>
                                                                {report.category?.replace('_', ' ')}
                                                            </div>
                                                        </div>
                                                        <div className="p-5 flex flex-col flex-grow">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${getPriorityColor(report.priority || 'Medium')}`}>
                                                                    {report.priority || 'Medium'} Priority
                                                                </span>
                                                                <span className="text-xs text-gray-400">{new Date(report.timestamp).toLocaleDateString()}</span>
                                                            </div>
                                                            <h3 className="font-bold text-gray-900 text-lg leading-snug mb-2 line-clamp-2">{report.description}</h3>
                                                            <p className="text-sm text-gray-500 flex flex-wrap items-center mt-auto mb-5 gap-1.5 font-medium">
                                                                <FaMapMarkerAlt className="text-gray-400" /> 
                                                                <span className="line-clamp-1">{report.location?.address || report.location?.city || 'General Area'}</span>
                                                            </p>
                                                            <button 
                                                                onClick={() => handleClaim(report._id)}
                                                                className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold rounded-xl transition-colors border border-indigo-100 hover:border-indigo-600 shadow-sm"
                                                            >
                                                                Claim Issue
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: My Activities */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-xl font-bold text-gray-900">My Activities</h2>
                                <p className="text-sm text-gray-500 mt-1">Issues you've claimed</p>
                            </div>
                            
                            <div className="p-6 flex-grow overflow-y-auto max-h-[800px]">
                                {loading && myClaims.length === 0 ? (
                                    <div className="space-y-4">
                                        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl"></div>)}
                                    </div>
                                ) : myClaims.length === 0 ? (
                                    <div className="text-center py-10 opacity-60">
                                        <FaHandsHelping className="mx-auto text-4xl text-gray-300 mb-3" />
                                        <p className="text-gray-500">You haven't claimed any issues yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {myClaims.map(report => {
                                            const isRes = ['resolved', 'completed'].includes((report.status || '').toLowerCase());
                                            return (
                                                <div key={report._id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-gray-300 transition-colors">
                                                    {isRes && <div className="absolute top-0 right-0 w-2 h-full bg-green-500"></div>}
                                                    {!isRes && <div className="absolute top-0 right-0 w-2 h-full bg-yellow-400"></div>}
                                                    
                                                    <div className="flex gap-4">
                                                        <div 
                                                            className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden cursor-pointer"
                                                            onClick={() => setSelectedImage(report.imageUrl)}
                                                        >
                                                            <img 
                                                                src={report.imageUrl} 
                                                                alt="issue" 
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                                onError={(e) => e.target.src = "https://via.placeholder.com/150"}
                                                            />
                                                        </div>
                                                        <div className="flex-grow">
                                                            <div className="flex justify-between items-start">
                                                                <span className="text-xs font-bold text-gray-500 flex items-center mb-1 uppercase tracking-wider">
                                                                    <span className="mr-1">{getIcon(report.category)}</span> {report.category?.replace('_', ' ')}
                                                                </span>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getStatusColor(report.status)}`}>
                                                                    {report.status || 'Active'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight mb-2">{report.description}</p>
                                                            
                                                            {!isRes && (
                                                                <button 
                                                                    onClick={() => handleResolve(report._id)}
                                                                    className="w-full py-2 bg-green-50 hover:bg-green-600 text-green-700 hover:text-white text-xs font-bold rounded-lg transition-colors border border-green-200 hover:border-green-600 shadow-sm flex items-center justify-center"
                                                                >
                                                                    <FaCheckCircle className="mr-1.5" /> Mark Resolved
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
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
        </div>
    );
};

export default NgoDashboard;
