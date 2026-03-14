export function getDepartment(category) {
    const cat = category?.toLowerCase() || "";
    if (cat.includes("garbage") || cat.includes("waste") || cat.includes("sanitation")) return "Sanitation";
    if (cat.includes("pothole") || cat.includes("road")) return "Roads";
    if (cat.includes("street") || cat.includes("electric") || cat.includes("light")) return "Electricity";
    if (cat.includes("water") || cat.includes("drainage") || cat.includes("pipe")) return "Water & Sewage";
    if (cat.includes("animal") || cat.includes("tree")) return "NGO / Community";
    return "General Management";
}

export function getPriorityColor(priority) {
    switch (priority?.toLowerCase()) {
        case 'high': return 'bg-red-100 text-red-800 border-red-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'low': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

export function getStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'submitted': return 'bg-blue-100 text-blue-800';
        case 'acknowledged': return 'bg-purple-100 text-purple-800';
        case 'in progress': return 'bg-yellow-100 text-yellow-800';
        case 'resolved': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}
