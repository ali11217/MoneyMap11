const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const expenseController = require('../controllers/expenseController');
const Expense = require('../models/Expense');
const mongoose = require('mongoose');

// Get all expenses with pagination
router.get('/', auth, expenseController.getExpenses);

// Create new expense
router.post('/', [auth, expenseController.validateExpense], expenseController.addExpense);

// Update expense
router.put('/:id', [auth, expenseController.validateExpense], expenseController.updateExpense);

// Delete expense
router.delete('/:id', auth, expenseController.deleteExpense);

// Get expense summary
router.get('/summary', auth, async (req, res) => {
  try {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const [totalExpenses, expensesByCategory] = await Promise.all([
      Expense.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.user.id),
            date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
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
            amount: { $sum: '$amount' }
          }
        },
        {
          $project: {
            category: '$_id',
            amount: 1,
            _id: 0
          }
        }
      ])
    ]);

    res.json({
      total: totalExpenses[0]?.total || 0,
      byCategory: expensesByCategory
    });
  } catch (error) {
    console.error('Error getting expense summary:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router; 