require('dotenv').config();
console.log('Email Username:', process.env.EMAIL_USERNAME);
console.log('Email Password exists:', !!process.env.EMAIL_APP_PASSWORD);
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_APP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
async function testEmail() {
  try {
    // Verify connection configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: process.env.EMAIL_USERNAME,
      subject: "Test Email from MoneyMap",
      text: "This is a test email to verify the email configuration is working.",
      html: `
        <div style="padding: 20px; background-color: #f5f5f5;">
          <h2>Test Email</h2>
          <p>If you're seeing this, your email configuration is working correctly! 🎉</p>
          <p>You can now proceed with the application.</p>
        </div>
      `
    });

    console.log("Test email sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_APP_PASSWORD) {
      console.error("Missing email credentials in .env file!");
    }
  }
}

testEmail(); 