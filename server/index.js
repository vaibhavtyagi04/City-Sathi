const express = require('express');
const mongoose = require('mongoose');
const { startEscalationJob } = require('./jobs/escalationJob');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL,
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
mongoose.connect('mongodb://localhost:27017/csapp')
    .then(() => {
        console.log('MongoDB connected');
        startEscalationJob();
    })
    .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
