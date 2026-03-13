const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { 
        type: String, 
        required: true,
        enum: ['garbage', 'stray_animal', 'street_light', 'pothole', 'drainage', 'other']
    },
    department: { 
        type: String, 
        enum: ['sanitation', 'roads', 'electricity', 'drainage', 'general'],
        default: 'general'
    },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    location: {
        lat: Number,
        lng: Number,
        address: String
    },
    status: { 
        type: String, 
        enum: ['pending', 'in-review', 'resolved', 'rejected'],
        default: 'pending' 
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolutionProofUrl: { type: String },
    remarks: { type: String },
    resolvedAt: { type: Date },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);
