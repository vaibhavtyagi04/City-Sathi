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
        enum: ['sanitation', 'roads', 'electricity', 'drainage', 'general', 'ngo'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
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
        enum: ['submitted', 'acknowledged', 'in_progress', 'resolved', 'rejected', 'pending', 'in-review'],
        default: 'submitted' 
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    publicUrl: { type: String },
    tweetId: { type: String },
    escalationLevel: { type: Number, default: 0 },
    lastStatusUpdate: { type: Date, default: Date.now },
    resolutionProofUrl: { type: String },
    remarks: { type: String },
    aiDetectedCategory: { type: String },
    aiConfidence: { type: Number },
    aiVerified: { type: Boolean, default: false },
    aiGeneratedDescription: { type: String },
    resolvedAt: { type: Date },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);
