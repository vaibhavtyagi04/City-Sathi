const express = require('express');
const router = express.Router();
const multer = require('multer'); // ADDED BACK
const jwt = require('jsonwebtoken'); // ADDED BACK
const Report = require('../models/Report'); // ADDED BACK
const Notification = require('../models/Notification');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

const { verifyToken, authorizeRoles } = require('../middleware/auth');
const admin = require('../middleware/admin'); // Kept for legacy if needed, but RBAC is preferred

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
router.post('/', verifyToken, (req, res) => {
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
        const categoryMap = {
            'street_light': ['street', 'light', 'lamp', 'lantern', 'spotlight', 'pole', 'night'],
            'garbage': ['garbage', 'trash', 'waste', 'litter', 'rubbish', 'plastic', 'dump', 'pile'],
            'pothole': ['pothole', 'crack', 'road', 'asphalt', 'hole', 'pavement', 'street'],
            'drainage': ['drain', 'water', 'flood', 'pipe', 'sewage', 'gutter', 'leak'],
            'stray_animal': ['dog', 'cat', 'cow', 'animal', 'stray', 'wildlife', 'pet']
        };

        const relevantKeywords = categoryMap[category] || [];
        
        if (relevantKeywords.length > 0) {
            try {
                console.log(`Analyzing image for ${category} report...`);
                const predictions = await classifyImage(req.file.buffer);
                console.log("AI Predictions:", predictions);

                const isRelevant = predictions.some(p =>
                    relevantKeywords.some(keyword => p.className.toLowerCase().includes(keyword))
                );

                if (!isRelevant) {
                    console.log(`Image rejected for category ${category}.`);
                    return res.status(400).json({
                        msg: `Image rejected. Please upload a photo relevant to ${category.replace('_', ' ')}. AI detected: ${predictions[0].className}`
                    });
                }
                console.log(`Image accepted for ${category}.`);
            } catch (aiError) {
                console.error("AI Classification failed, allowing upload as fallback:", aiError);
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

            // Automated department assignment based on category
            const deptMap = {
                'garbage': 'sanitation',
                'street_light': 'electricity',
                'pothole': 'roads',
                'drainage': 'drainage',
                'stray_animal': 'general',
                'other': 'general'
            };

            const newReport = new Report({
                userId: req.user.id,
                category,
                department: deptMap[category] || 'general',
                description,
                imageUrl: result.secure_url,
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
router.get('/user', verifyToken, async (req, res) => {
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
router.get('/admin/all', [verifyToken, authorizeRoles('admin')], async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('userId', 'fullName email phone')
            .sort({ timestamp: -1 });
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update Report (Admin/Municipality/NGO)
router.put('/:id', [verifyToken, authorizeRoles('admin', 'municipality', 'ngo')], async (req, res) => {
    const { status, remarks, department, assignedTo } = req.body;
    try {
        let report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ msg: 'Report not found' });

        // Municipality can only update reports in their department
        if (req.user.role === 'municipality' && report.department !== req.user.department) {
            return res.status(403).json({ msg: 'Not authorized to update reports outside your department' });
        }

        if (status) report.status = status;
        if (remarks) report.remarks = remarks;
        if (department && req.user.role === 'admin') report.department = department;
        if (assignedTo && req.user.role === 'admin') report.assignedTo = assignedTo;
        
        if (status === 'resolved' && !report.resolvedAt) {
            report.resolvedAt = Date.now();

            const notification = new Notification({
                userId: report.userId,
                message: `Your report regarding '${report.category}' has been resolved.`,
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

// --- MUNICIPALITY ROUTES ---

router.get('/dept/assigned', [verifyToken, authorizeRoles('municipality')], async (req, res) => {
    try {
        const reports = await Report.find({ department: req.user.department })
            .populate('userId', 'fullName email phone')
            .sort({ timestamp: -1 });
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- NGO ROUTES ---

router.get('/ngo/available', [verifyToken, authorizeRoles('ngo')], async (req, res) => {
    try {
        // NGOs see community-related issues that are pending
        const reports = await Report.find({ 
            category: { $in: ['stray_animal', 'garbage', 'other'] },
            status: 'pending'
        })
        .populate('userId', 'fullName email phone')
        .sort({ timestamp: -1 });
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
