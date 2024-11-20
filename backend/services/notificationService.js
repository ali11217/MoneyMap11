const nodemailer = require('nodemailer');
const Budget = require('../models/Budget');
const User = require('../models/User');

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

const sendBudgetAlert = async (userId, budgetAlert) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.email) return;

    const { category, threshold, spent, budget, percentage } = budgetAlert;
    
    const emailContent = `
      <h2>Budget Alert for ${category}</h2>
      <p>You have spent ${percentage.toFixed(1)}% of your budget for ${category}.</p>
      <ul>
        <li>Budget: $${budget}</li>
        <li>Spent: $${spent}</li>
        <li>Remaining: $${(budget - spent).toFixed(2)}</li>
      </ul>
      <p>This alert was triggered because you exceeded ${threshold}% of your budget.</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: user.email,
      subject: `Budget Alert: ${category} spending threshold reached`,
      html: emailContent
    });

  } catch (error) {
    console.error('Error sending budget alert email:', error);
  }
};

module.exports = { sendBudgetAlert }; 