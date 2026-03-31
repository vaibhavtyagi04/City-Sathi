require('dotenv').config({ path: './server/.env' });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function testMail() {
    console.log("Testing mail with User:", process.env.EMAIL_USER);
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: "Test Mail",
            text: "Hello from CitySathi Test Script"
        });
        console.log("Mail sent successfully:", info.messageId);
    } catch (error) {
        console.error("Mail failed:", error);
    }
}

testMail();
