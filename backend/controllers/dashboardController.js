const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const mongoose = require('mongoose');

const dashboardController = {
  // Get dashboard summary
  getDashboardSummary: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const [income, expenses, budgets, recentTransactions] = await Promise.all([
        // Get total income
        Transaction.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(req.user.id),
              type: 'income',
              date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).session(session),

        // Get expenses by category
        Expense.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(req.user.id),
              date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
            }
          },
          {
            $group: {
              _id: '$category',
              total: { $sum: '$amount' }
            }
          }
        ]).session(session),

        // Get budgets status
        Budget.find({
          user: req.user.id,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear()
        }).lean().session(session),

        // Get recent transactions
        Transaction.find({
          user: req.user.id,
          date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
        }).sort({ date: -1 }).limit(5).session(session)
      ]);

      res.json({ income, expenses, budgets, recentTransactions });
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      res.status(500).json({ error: 'Server error' });
    } finally {
      session.endSession();
    }
  }
}; 