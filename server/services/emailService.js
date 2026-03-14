const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // Try 465 for SSL or 587 for TLS
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function sendOTP(email, otp) {
  try {
    const info = await transporter.sendMail({
      from: `"CitySathi" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "CitySathi Login OTP 🇮🇳",
      html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px;">
        
        <div style="max-width:600px; margin:auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background:linear-gradient(90deg,#FF9933,#FFFFFF,#138808); padding:20px; text-align:center;">
            <h1 style="margin:0; color:#222;">🇮🇳 CitySathi</h1>
            <p style="margin:5px 0; font-size:14px; color:#333;">
              Together let's make our India cleaner & smarter
            </p>
          </div>

          <!-- Body -->
          <div style="padding:30px; text-align:center;">
            
            <h2 style="color:#333;">Your Login OTP</h2>
            
            <p style="color:#555; font-size:15px;">
              Use the OTP below to securely login to your CitySathi account.
            </p>

            <!-- OTP Box -->
            <div style="margin:30px auto; font-size:32px; letter-spacing:6px; font-weight:bold; 
                        color:#138808; background:#f1f5f9; padding:15px 25px; 
                        border-radius:10px; display:inline-block;">
              ${otp}
            </div>

            <p style="color:#666; font-size:14px;">
              This OTP will expire in <b>5 minutes</b>.
            </p>

            <p style="margin-top:25px; font-size:15px; color:#444;">
              🇮🇳 <b>Let's build a cleaner, smarter India together.</b>
            </p>

          </div>

          <!-- Footer -->
          <div style="background:#f8fafc; padding:20px; text-align:center; font-size:12px; color:#777;">
            <p style="margin:0;">CitySathi – Empowering citizens to improve their city.</p>
            <p style="margin:5px 0;">If you didn't request this OTP, please ignore this email.</p>
          </div>

        </div>

      </div>
      `
    });

    console.log("OTP Email sent:", info.messageId);
    return info;

  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
}


module.exports = { sendOTP };
