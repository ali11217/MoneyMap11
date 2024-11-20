const cron = require('node-cron');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { sendBudgetAlert } = require('../services/notificationService');

const checkBudgets = async () => {
  const currentDate = new Date();
  const budgets = await Budget.find({
    'notifications.email.enabled': true
  });

  for (const budget of budgets) {
    try {
      const expenses = await Expense.aggregate([
        {
          $match: {
            user: budget.user,
            category: budget.category,
            date: {
              $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
              $lt: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const spent = expenses[0]?.total || 0;
      const percentage = (spent / budget.amount) * 100;
      const threshold = budget.notifications.email.threshold;

      if (percentage >= threshold && 
          (!budget.notifications.email.lastSent || 
           Date.now() - budget.notifications.email.lastSent.getTime() > 24 * 60 * 60 * 1000)) {
        
        await sendBudgetAlert(budget.user, {
          category: budget.category,
          threshold,
          spent,
          budget: budget.amount,
          percentage
        });

        budget.notifications.email.lastSent = new Date();
        await budget.save();
      }
    } catch (error) {
      console.error(`Error processing budget alert for ${budget._id}:`, error);
    }
  }
};

// Run every day at midnight
cron.schedule('0 0 * * *', checkBudgets); 