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
const { assignDepartment } = require('../utils/departmentAssignment');
const { getDistanceInMeters } = require('../utils/geoUtils');
const { postComplaintTweet } = require('../services/twitterService');

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

        // AI check is now handled via the /api/ai/predict pre-flight route on the frontend.
        // The user confirmed the category, so we trust it here.

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
            // DUPLICATE DETECTION
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentReports = await Report.find({
                category,
                timestamp: { $gte: oneDayAgo }
            });

            let duplicateReportId = null;
            if (loc && loc.lat && loc.lng) {
                for (const existingReport of recentReports) {
                    if (existingReport.location && existingReport.location.lat && existingReport.location.lng) {
                        const distance = getDistanceInMeters(
                            loc.lat, loc.lng,
                            existingReport.location.lat, existingReport.location.lng
                        );
                        if (distance <= 50) {
                            duplicateReportId = existingReport._id;
                            break;
                        }
                    }
                }
            }

            if (duplicateReportId) {
                return res.status(409).json({
                    msg: 'This issue was already reported nearby recently. You can view or upvote the existing one.',
                    existingReportId: duplicateReportId
                });
            }

            const result = await uploadToCloudinary(req.file.buffer);

            const assignedDept = assignDepartment(category);
            const priority = req.body.priority || 'Medium';

            const newReport = new Report({
                userId: req.user.id,
                category,
                department: assignedDept,
                priority,
                description,
                imageUrl: result.secure_url,
                location: loc,
                status: 'submitted',
                aiDetectedCategory: req.body.aiDetectedCategory || null,
                aiConfidence: req.body.aiConfidence || null,
                aiVerified: req.body.aiVerified === 'true',
                aiGeneratedDescription: req.body.aiGeneratedDescription || null
            });

            const report = await newReport.save();

            // Generate public URL
            report.publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/issues/${report._id}`;
            await report.save();

            // Trigger Twitter API auto-post
            const tweetId = await postComplaintTweet(report);
            if (tweetId) {
                report.tweetId = tweetId;
                await report.save();
            }

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
        const reports = await Report.find().select('category description location imageUrl timestamp priority status publicUrl')
            .sort({ timestamp: -1 });
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get Single Report (Public for Tracking Page)
router.get('/public/:id', async (req, res) => {
    try {
        const report = await Report.findById(req.params.id).populate('userId', 'fullName');
        if (!report) return res.status(404).json({ msg: 'Report not found' });
        res.json(report);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Report not found' });
        }
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
    const { status, remarks, department, assignedTo, priority, escalationLevel } = req.body;
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
        if (priority && req.user.role === 'admin') report.priority = priority;
        if (escalationLevel !== undefined && req.user.role === 'admin') report.escalationLevel = escalationLevel;
        
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
