const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    location: {
        lat: Number,
        lng: Number,
        address: String
    },
    status: { type: String, default: 'pending' }, // pending, resolved
    remarks: { type: String },
    resolvedAt: { type: Date },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);
