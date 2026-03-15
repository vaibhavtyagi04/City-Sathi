const express = require('express');
const mongoose = require('mongoose');
const { startEscalationJob } = require('./jobs/escalationJob');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
const uploadsPath = path.join(__dirname, '../uploads');
console.log("Serving uploads from:", uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Request Logger
app.use((req, res, next) => {
    console.log(`${req.method} request to ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ai', require('./routes/ai'));

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/csapp')
    .then(() => {
        console.log('MongoDB connected');
        startEscalationJob();
    })
    .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
