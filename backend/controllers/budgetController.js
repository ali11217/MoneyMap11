const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Get all budgets for current month
exports.getCurrentBudgets = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Added pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const budgets = await Budget.find({
      user: req.user.id,
      month: currentMonth,
      year: currentYear
    })
    .skip(skip)
    .limit(limit)
    .lean(); // Added for better performance

    // Get total count for pagination
    const total = await Budget.countDocuments({
      user: req.user.id,
      month: currentMonth,
      year: currentYear
    });

    res.json({
      budgets,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching budgets:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Create or update budget
exports.setBudget = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, amount, rollover, alerts } = req.body;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Validate category
    if (!category || typeof category !== 'string') {
      return res.status(400).json({ error: 'Valid category is required' });
    }

    const currentDate = new Date();

    let budget = await Budget.findOne({
      user: req.user.id,
      category,
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear()
    }).session(session);

    if (budget) {
      budget.amount = amount;
      budget.rollover = rollover;
      if (alerts) {
        budget.alerts = alerts;
      }
    } else {
      budget = new Budget({
        user: req.user.id,
        category,
        amount,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        rollover,
        alerts
      });
    }

    await budget.save();
    res.json(budget);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get budget comparison
exports.getBudgetComparison = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const budgets = await Budget.find({
      user: req.user.id,
      month: currentMonth,
      year: currentYear
    });

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0);

    const expenses = await Expense.find({
      user: req.user.id,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    const comparison = budgets.map(budget => {
      const budgetExpenses = expenses.filter(expense => expense.category === budget.category);
      const spent = budgetExpenses.reduce((total, expense) => total + expense.amount, 0);
      return {
        category: budget.category,
        budgeted: budget.amount,
        spent,
        remaining: budget.amount - spent,
        percentageUsed: (spent / budget.amount) * 100
      };
    });

    res.json(comparison);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete budget
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ msg: 'Budget not found' });
    }

    // Make sure user owns budget
    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Budget.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Budget removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}; 