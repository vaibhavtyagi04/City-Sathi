const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTP } = require('../services/emailService');
const generateOTP = require('../utils/generateOTP');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

const bcrypt = require('bcryptjs');

// Register User
router.post('/register', async (req, res) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({ fullName, email, password });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = { 
            user: { 
                id: user.id,
                role: user.role,
                department: user.department 
            } 
        };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Login User
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const payload = { 
            user: { 
                id: user.id,
                role: user.role,
                department: user.department 
            } 
        };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, department: user.department } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Deprecated OTP routes (Keeping for backward compatibility during transition)
router.post('/send-otp', async (req, res) => {
    res.status(410).json({ msg: 'OTP service is deprecated. Please use Email/Password login.' });
});

router.post('/verify-otp', async (req, res) => {
    res.status(410).json({ msg: 'OTP service is deprecated. Please use Email/Password login.' });
});

// Get User (Me)
router.get('/me', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
        res.json(user);
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
});

module.exports = router;
