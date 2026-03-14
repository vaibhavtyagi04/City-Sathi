const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendOTP(email, otp) {
  try {
    const info = await transporter.sendMail({
      from: `"CitySathi" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'CitySathi Login OTP',
      text: `Your OTP for CitySathi is ${otp}. It will expire in 5 minutes.`
    });
    console.log('OTP Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
}

module.exports = { sendOTP };
