const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { 
        type: String, 
        enum: ['user', 'admin', 'municipality', 'ngo'], 
        default: 'user' 
    },
    department: { 
        type: String, 
        enum: ['sanitation', 'roads', 'electricity', 'drainage', 'general', 'none'], 
        default: 'none' 
    },
    password: { type: String }, // Optional for social login
    googleId: { type: String },
    facebookId: { type: String },
    otp: { type: String },
    otpExpires: { type: Date },
    phone: { type: String },
    state: { type: String },
    district: { type: String },
    city: { type: String },
    address: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
