const Expense = require('../models/Expense');
const { validationResult, check } = require('express-validator');
const mongoose = require('mongoose');

// Validation middleware
const validateExpense = [
  check('amount').isNumeric().withMessage('Amount must be a number'),
  check('category').notEmpty().withMessage('Category is required'),
  check('description').optional().trim().escape(),
  check('date').optional().isISO8601().toDate()
];

// Export validation middleware
exports.validateExpense = validateExpense;

exports.getExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const expenses = await Expense.find({ user: req.user.id })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Expense.countDocuments({ user: req.user.id });

    res.json({
      expenses,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description, amount, category, date } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const newExpense = new Expense({
      user: req.user.id,
      description: description?.trim(),
      amount: parseFloat(amount),
      category,
      date: date ? new Date(date) : new Date()
    });

    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (err) {
    console.error('Error adding expense:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description, amount, category, date } = req.body;
    
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const expenseFields = {
      description: description?.trim(),
      amount: parseFloat(amount),
      category,
      date: date ? new Date(date) : expense.date
    };

    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { $set: expenseFields },
      { new: true }
    );

    res.json(expense);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    let expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense removed', id: req.params.id });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
}; 