import React from 'react';
import { FaCheckCircle, FaCircle, FaSpinner, FaPaperPlane } from 'react-icons/fa';

const steps = [
    { id: 'Submitted', icon: FaPaperPlane },
    { id: 'Acknowledged', icon: FaCircle },
    { id: 'In Progress', icon: FaSpinner },
    { id: 'Resolved', icon: FaCheckCircle }
];

const ActivityTimeline = ({ currentStatus }) => {
    // Determine the index of the current status
    const currentIndex = steps.findIndex(s => s.id.toLowerCase() === currentStatus?.toLowerCase());
    const activeIndex = currentIndex >= 0 ? currentIndex : 0; // fallback to 0

    return (
        <div className="flex flex-col md:flex-row items-center justify-between w-full py-4 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full transform -translate-y-1/2"></div>
            {steps.map((step, index) => {
                const isActive = index <= activeIndex;
                const isCurrent = index === activeIndex;
                const Icon = step.icon;

                return (
                    <div key={step.id} className="flex flex-col items-center mb-4 md:mb-0 relative bg-white md:bg-transparent px-2">
                        <div className={`
                            flex items-center justify-center w-10 h-10 rounded-full border-4 
                            ${isActive ? 'bg-indigo-600 border-indigo-200 text-white' : 'bg-white border-gray-200 text-gray-400'}
                            ${isCurrent && step.id === 'In Progress' ? 'animate-pulse' : ''}
                            transition-all duration-300 shadow-sm
                        `}>
                            <Icon className={isCurrent && step.id === 'In Progress' ? 'animate-spin' : ''} size={14} />
                        </div>
                        <span className={`mt-2 text-xs font-semibold ${isActive ? 'text-indigo-800' : 'text-gray-400'}`}>
                            {step.id}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default ActivityTimeline;
