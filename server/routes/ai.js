const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');
const { classifyImage } = require('../utils/imageClassifier');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10000000 }, // 10MB
}).single('image');

// Map MobileNet predictions to our specific civic issue categories
const mapPredictionToCategory = (predictions) => {
    const categoryMap = {
        'street_light': ['street', 'light', 'lamp', 'lantern', 'spotlight', 'pole', 'night'],
        'garbage': ['garbage', 'trash', 'waste', 'litter', 'rubbish', 'plastic', 'dump', 'pile'],
        'pothole': ['pothole', 'crack', 'road', 'asphalt', 'hole', 'pavement', 'street', 'dirt', 'surface'],
        'drainage': ['drain', 'water', 'flood', 'pipe', 'sewage', 'gutter', 'leak', 'manhole'],
        'stray_animal': ['dog', 'cat', 'cow', 'animal', 'stray', 'wildlife', 'pet']
    };

    let bestMatch = { category: 'other', confidence: 0 };

    for (const prediction of predictions) {
        const className = prediction.className.toLowerCase();
        
        for (const [category, keywords] of Object.entries(categoryMap)) {
            if (keywords.some(keyword => className.includes(keyword))) {
                // If this match has a higher probability than our current best, update it
                if (prediction.probability > bestMatch.confidence) {
                    bestMatch = {
                        category,
                        confidence: prediction.probability,
                        rawClass: prediction.className
                    };
                }
            }
        }
    }

    return bestMatch;
};

// Predict Image Category
router.post('/predict', verifyToken, (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ msg: 'File upload error' });
        if (!req.file) return res.status(400).json({ msg: 'No image provided for analysis' });

        try {
            console.log("Analyzing image for AI categorization...");
            const predictions = await classifyImage(req.file.buffer);
            console.log("Raw MobileNet Output:", predictions);

            const result = mapPredictionToCategory(predictions);
            
            // Generate description
            let description = '';
            if (result.category !== 'other') {
                switch (result.category) {
                    case 'garbage':
                        description = "Garbage accumulation detected in a public area. Waste appears to be overflowing and requires immediate sanitation attention.";
                        break;
                    case 'pothole':
                        description = "A road pothole detected on the street surface. This may cause vehicle damage or accidents and should be repaired promptly.";
                        break;
                    case 'drainage':
                        description = "Drainage blockage detected. Water flow may be obstructed which could cause flooding or sanitation issues.";
                        break;
                    case 'street_light':
                        description = "Street light infrastructure issue detected. This may affect nighttime visibility and public safety in the area.";
                        break;
                    case 'stray_animal':
                        description = "Stray animal(s) detected in the vicinity. Animal control or welfare services may be required.";
                        break;
                }
            }
            
            res.json({
                category: result.category,
                confidence: parseFloat(result.confidence.toFixed(4)),
                description: description,
                predictions: predictions // Send raw predictions just in case frontend wants them
            });
        } catch (error) {
            console.error("AI Prediction Route Error:", error);
            res.status(500).json({ msg: 'AI analysis failed. Please select a category manually.' });
        }
    });
});

module.exports = router;
