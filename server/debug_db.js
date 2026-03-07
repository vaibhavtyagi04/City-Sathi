const mongoose = require('mongoose');
const Report = require('./models/Report');

mongoose.connect('mongodb://localhost:27017/csapp')
    .then(async () => {
        console.log('Connected to DB');
        const latestReport = await Report.findOne().sort({ timestamp: -1 });
        console.log('Latest Report Image URL:', latestReport ? latestReport.imageUrl : 'No reports found');
        mongoose.disconnect();
    })
    .catch(err => console.error(err));
