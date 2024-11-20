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

const sendVerificationEmail = async (email, verificationToken) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: 'Verify Your Email - MoneyMap',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #2c3e50; text-align: center;">Welcome to MoneyMap!</h2>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
          <p>Hello,</p>
          <p>Thank you for registering with MoneyMap. Please verify your email address to continue:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" 
               style="background-color: #3498db; 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 5px;
                      display: inline-block;">
              Verify Email
            </a>
          </div>
          <p>This link will expire in 24 hours.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
};

const sendTempPasswordEmail = async (email, tempPassword) => {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: 'Temporary Password - MoneyMap',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #2c3e50; text-align: center;">Password Reset</h2>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
          <p>Hello,</p>
          <p>Here is your temporary password for MoneyMap:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f1f1f1; 
                        padding: 15px; 
                        border-radius: 5px; 
                        font-family: monospace; 
                        font-size: 18px;">
              ${tempPassword}
            </div>
          </div>
          <p>Please login with this temporary password and change it immediately in your account settings.</p>
          <p style="color: #e74c3c;"><strong>Note:</strong> For security reasons, this temporary password will expire in 1 hour.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
            If you didn't request this password reset, please contact support immediately.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send temporary password email');
  }
};

module.exports = {
  sendVerificationEmail,
  sendTempPasswordEmail
}; 