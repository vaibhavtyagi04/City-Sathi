import React from 'react';

const categories = ['All', 'Garbage', 'Potholes', 'Streetlights', 'Drainage', 'Other'];

const MapFilter = ({ currentFilter, setFilter }) => {
    return (
        <div className="flex flex-wrap gap-2 mb-4 p-2 bg-white rounded-lg shadow-sm border border-gray-100 w-full">
            <span className="text-sm font-semibold text-gray-600 flex items-center mr-2">Filter:</span>
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        currentFilter === cat || (!currentFilter && cat === 'All')
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
};

export default MapFilter;
