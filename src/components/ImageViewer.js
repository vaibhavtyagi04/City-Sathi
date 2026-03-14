import React from 'react';
import { FaTimes } from 'react-icons/fa';

const ImageViewer = ({ isOpen, imageUrl, onClose }) => {
    if (!isOpen || !imageUrl) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 z-[9999]" onClick={onClose}>
            <div className="relative max-w-4xl w-full flex justify-center" onClick={e => e.stopPropagation()}>
                <button 
                    className="absolute -top-10 right-0 text-white hover:text-gray-300 text-3xl"
                    onClick={onClose}
                >
                    <FaTimes />
                </button>
                <img 
                    src={imageUrl} 
                    alt="Complaint Preview" 
                    className="max-h-[85vh] object-contain rounded-lg shadow-2xl bg-gray-900 border border-gray-700"
                />
            </div>
        </div>
    );
};

export default ImageViewer;
