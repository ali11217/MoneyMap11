require('dotenv').config();
const mongoose = require('mongoose');
const { sendBudgetAlert } = require('./services/notificationService');

async function testBudgetAlert() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Create a test budget
    const Budget = require('./models/Budget');
    const testBudget = new Budget({
      user: new mongoose.Types.ObjectId(), // This will create a new random ObjectId
      category: 'Food',
      amount: 500,
      notifications: {
        email: {
          enabled: true,
          threshold: 80
        }
      }
    });
    
    await testBudget.save();

    // Create a test expense
    const Expense = require('./models/Expense');
    const testExpense = new Expense({
      user: testBudget.user,
      category: 'Food',
      amount: 450,
      date: new Date()
    });
    
    await testExpense.save();

    // Send test alert
    const testAlert = {
      category: 'Food',
      threshold: 80,
      spent: 450,
      budget: 500,
      percentage: 90
    };

    await sendBudgetAlert(testBudget.user, testAlert);
    console.log('Budget alert test email sent successfully!');
    
    // Cleanup
    await Budget.deleteOne({ _id: testBudget._id });
    await Expense.deleteOne({ _id: testExpense._id });
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error sending budget alert:', error);
  }
}

testBudgetAlert(); 