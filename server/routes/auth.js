const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTP } = require('../services/emailService');
const generateOTP = require('../utils/generateOTP');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Send OTP
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    try {
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        let user = await User.findOne({ email });
        
        if (user) {
            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();
        } else {
            // Create a new user automatically
            const fullName = email.split('@')[0];
            user = new User({
                fullName,
                email,
                otp,
                otpExpires
            });
            await user.save();
        }

        // CHECK FOR PRESENTATION MODE OR EMERGENCY FALLBACK
        const isPresentationMode = process.env.PRESENTATION_MODE === 'true';
        
        if (isPresentationMode) {
            console.log("PRESENTATION MODE ENABLED: Skipping real email, using 123456");
            user.otp = '123456';
            user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();
            return res.status(200).json({ 
                msg: 'OTP sent (Presentation Mode: Use 123456)', 
                presentation: true 
            });
        }

        try {
            await sendOTP(email, otp);
            res.status(200).json({ msg: 'OTP sent successfully' });
        } catch (mailError) {
            console.error("Mail Service Error:", mailError);
            
            // EMERGENCY FALLBACK (If email fails, allow 123456 for the owner)
            if (email === process.env.EMAIL_USER || email === 'vaibtyagi121@gmail.com') {
                user.otp = '123456';
                user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
                await user.save();
                return res.status(200).json({ 
                    msg: 'Email service unavailable. Using emergency OTP: 123456', 
                    debug: mailError.message 
                });
            }
            
            res.status(500).json({ 
                msg: 'Email service connection timeout. Please contact admin or use presentation mode.',
                error: mailError.message 
            });
        }
    } catch (err) {
        console.error("Database/Auth Error:", err);
        res.status(500).json({ msg: 'Server Error: ' + err.message });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ msg: 'Email and OTP are required' });

    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'User not found' });

        if (user.otp !== otp) return res.status(400).json({ msg: 'Invalid OTP' });
        if (user.otpExpires < new Date()) return res.status(400).json({ msg: 'OTP has expired' });

        // Clear OTP after successful verification
        user.otp = undefined;
        user.otpExpires = undefined;
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
            res.json({ token, user: { id: user.id, role: user.role, department: user.department } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
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
