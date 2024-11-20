const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

const checkBudgetThresholds = async (userId) => {
  const alerts = [];
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  try {
    // Get all budgets for user
    const budgets = await Budget.find({
      user: userId,
      'notifications.email.enabled': true
    });

    for (const budget of budgets) {
      // Get total expenses for this budget's category
      const expenses = await Expense.aggregate([
        {
          $match: {
            user: userId,
            category: budget.category,
            date: {
              $gte: firstDayOfMonth,
              $lte: lastDayOfMonth
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

      // Check if we've exceeded the threshold
      if (percentage >= budget.notifications.email.threshold) {
        // Check if we haven't sent an alert in the last 24 hours
        const canSendAlert = !budget.notifications.email.lastSent || 
          (Date.now() - budget.notifications.email.lastSent.getTime() > 24 * 60 * 60 * 1000);

        if (canSendAlert) {
          alerts.push({
            budgetId: budget._id,
            category: budget.category,
            budgetAmount: budget.amount,
            spent,
            percentage,
            threshold: budget.notifications.email.threshold
          });

          // Update last sent time
          budget.notifications.email.lastSent = new Date();
          await budget.save();
        }
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error checking budget thresholds:', error);
    throw error;
  }
};

module.exports = { checkBudgetThresholds };