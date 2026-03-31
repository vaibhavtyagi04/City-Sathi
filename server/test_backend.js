const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const { sendOTP } = require('./services/emailService');

async function testAll() {
    console.log("--- Testing Backend Configuration ---");
    console.log("Local Time:", new Date().toString());
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("MONGO_URI:", process.env.MONGO_URI ? "Present" : "Missing");

    // Test DB
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected Successfully");
    } catch (err) {
        console.error("❌ MongoDB Connection Failed:", err.message);
    }

    // Test Mail
    try {
        console.log("Sending Test Email to", process.env.EMAIL_USER);
        await sendOTP(process.env.EMAIL_USER, "123456");
        console.log("✅ Email Sent Successfully");
    } catch (err) {
        console.error("❌ Email Sending Failed:", err.message);
    }

    process.exit(0);
}

testAll();
