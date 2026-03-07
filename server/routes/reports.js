const express = require('express');
const router = express.Router();
const multer = require('multer'); // ADDED BACK
const jwt = require('jsonwebtoken'); // ADDED BACK
const Report = require('../models/Report'); // ADDED BACK
const Notification = require('../models/Notification');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Cloudinary Config
// Cloudinary Config - Keep this
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// CHANGED: Use MemoryStorage to process file before upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // 10MB
}).single('image');

const { classifyImage } = require('../utils/imageClassifier');

// Create Report
router.post('/', auth, (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error("Multer error:", err);
            return res.status(400).json({ msg: err.message || err.toString() || 'File upload error' });
        }

        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

        const { category, description, location } = req.body;

        // Parse location
        let loc = {};
        try {
            loc = JSON.parse(location);
        } catch (e) {
            loc = {};
        }

        // --- IMAGE CLASSIFICATION CHECK ---
        if (category === 'street_light') {
            try {
                console.log("Analyzing image for Broken Streetlight report...");
                const predictions = await classifyImage(req.file.buffer);
                console.log("AI Predictions:", predictions);

                // Check if any prediction matches relevant keywords
                // We use a broader list to be safe: 'light', 'lamp', 'pole'
                const validKeywords = ['street', 'light', 'lamp', 'lantern', 'spotlight', 'pole'];
                const isRelevant = predictions.some(p =>
                    validKeywords.some(keyword => p.className.toLowerCase().includes(keyword))
                );

                if (!isRelevant) {
                    console.log("Image rejected significantly.");
                    return res.status(400).json({
                        msg: `Image rejected. Please upload a photo of a Streetlight. Cloud thinks this is: ${predictions[0].className}`
                    });
                }
                console.log("Image accepted as Streetlight.");
            } catch (aiError) {
                console.error("AI Classification failed, allowing upload as fallback:", aiError);
                // Fallback: Proceed if AI fails (don't block user due to server error)
            }
        }
        // ----------------------------------

        // Upload to Cloudinary (Stream Upload since we have buffer)
        const uploadToCloudinary = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'citysathi_reports',
                        allowed_formats: ['jpg', 'png', 'jpeg']
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                stream.end(buffer);
            });
        };

        try {
            const result = await uploadToCloudinary(req.file.buffer);

            const newReport = new Report({
                userId: req.user.id,
                category,
                description,
                imageUrl: result.secure_url, // Use the URL from Cloudinary result
                location: loc
            });

            const report = await newReport.save();
            res.json(report);
        } catch (err) {
            console.error("Upload/Save Error:", err);
            res.status(500).json({ msg: 'Server Error: ' + (err.message || err.toString()) });
        }
    });
});

// Get User Reports
router.get('/user', auth, async (req, res) => {
    try {
        const reports = await Report.find({ userId: req.user.id }).sort({ timestamp: -1 });
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get All Reports (Public for Map)
router.get('/', async (req, res) => {
    try {
        const reports = await Report.find().select('category description location imageUrl timestamp').sort({ timestamp: -1 });
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- ADMIN ROUTES ---

// Get All Reports (Admin Only)
router.get('/admin/all', [auth, admin], async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('userId', 'fullName email phone') // Get user details
            .sort({ timestamp: -1 });
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update Report Status & Remarks (Admin Only)
router.put('/admin/:id', [auth, admin], async (req, res) => {
    const { status, remarks } = req.body;
    try {
        let report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ msg: 'Report not found' });

        if (status) report.status = status;
        if (remarks) report.remarks = remarks;
        if (status === 'resolved' && !report.resolvedAt) {
            report.resolvedAt = Date.now();

            // Create Notification for User
            const notification = new Notification({
                userId: report.userId,
                message: `Good news! Your report regarding '${report.category}' has been resolved. Remarks: ${remarks || 'None'}`,
                reportId: report._id
            });
            await notification.save();
        }

        await report.save();
        res.json(report);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
