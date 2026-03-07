const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Register
router.post('/register', async (req, res) => {
    const { fullName, email, password, phone, state, district, city, address } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            fullName, email, password: hashedPassword, phone, state, district, city, address
        });

        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const payload = { user: { id: user.id } };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, role: user.role } });
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
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
});

// Social Login Helper
const socialLogin = async (res, email, fullName, googleId, facebookId) => {
    try {
        let user = await User.findOne({ email });

        if (user) {
            // Update social IDs if missing
            if (googleId && !user.googleId) user.googleId = googleId;
            if (facebookId && !user.facebookId) user.facebookId = facebookId;
            await user.save();
        } else {
            // Create new user
            user = new User({
                fullName,
                email,
                googleId,
                facebookId,
                password: '', // No password for social users
                phone: '',
                state: '',
                district: '',
                city: '',
                address: ''
            });
            await user.save();
        }

        const payload = { user: { id: user.id } };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Google Auth Route
const { verifyGoogleToken, verifyFacebookToken } = require('../utils/socialAuth');

router.post('/google', async (req, res) => {
    const { token } = req.body;
    try {
        const payload = await verifyGoogleToken(token);
        const { email, name, sub } = payload; // sub is googleId
        await socialLogin(res, email, name, sub, null);
    } catch (err) {
        console.error(err);
        res.status(401).json({ msg: 'Invalid Google Token' });
    }
});

// Facebook Auth Route
router.post('/facebook', async (req, res) => {
    const { accessToken, userID } = req.body;
    try {
        const data = await verifyFacebookToken(accessToken);
        if (data.id !== userID) throw new Error("User ID mismatch");
        await socialLogin(res, data.email, data.name, null, data.id);
    } catch (err) {
        console.error(err);
        res.status(401).json({ msg: 'Invalid Facebook Token' });
    }
});

module.exports = router;
