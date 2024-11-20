const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');
const { checkBudgetThresholds } = require('../utils/budgetAlerts');
const { sendBudgetAlert } = require('../services/notificationService');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');

// GET all budgets for a user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching budgets for user:', req.user.id);
    
    const budgets = await Budget.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    
    console.log('Found budgets:', budgets);
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// POST new budget
router.post('/', auth, async (req, res) => {
  try {
    const { category, amount, notifications } = req.body;
    
    const newBudget = new Budget({
      user: req.user.id,
      category,
      amount,
      notifications
    });

    const savedBudget = await newBudget.save();
    res.json(savedBudget);
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// PUT update budget
router.put('/:id', auth, async (req, res) => {
  try {
    const { category, amount, notifications } = req.body;
    
    // Find budget
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Verify user owns this budget
    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'User not authorized' });
    }

    // Update budget fields
    budget.category = category;
    budget.amount = amount;
    if (notifications) {
      budget.notifications = notifications;
    }

    const updatedBudget = await budget.save();
    res.json(updatedBudget);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// DELETE a budget
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Delete request for budget:', req.params.id);
    
    // Find budget
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      console.log('Budget not found');
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Verify user owns this budget
    if (budget.user.toString() !== req.user.id) {
      console.log('User not authorized');
      return res.status(401).json({ error: 'User not authorized' });
    }

    // Delete the budget
    await Budget.findByIdAndDelete(req.params.id);
    console.log('Budget deleted successfully');

    res.json({ message: 'Budget deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

// Check budget alerts
router.post('/check-alerts', auth, async (req, res) => {
  try {
    console.log('Checking budget alerts for user:', req.user.id);
    
    // Get all budgets with their current expenses
    const budgets = await Budget.find({ user: req.user.id });
    console.log('Found budgets:', budgets);

    const alerts = [];
    const currentDate = new Date();
    
    for (const budget of budgets) {
      // Get total expenses for this category
      const expenses = await Expense.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.user.id),
            category: budget.category,
            date: {
              $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
              $lte: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
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
      
      console.log(`Category: ${budget.category}`);
      console.log(`Budget Amount: $${budget.amount}`);
      console.log(`Spent Amount: $${spent}`);
      console.log(`Percentage: ${percentage}%`);
      console.log(`Threshold: ${budget.notifications?.email?.threshold || 80}%`);

      if (percentage >= (budget.notifications?.email?.threshold || 80)) {
        alerts.push({
          category: budget.category,
          budgetAmount: budget.amount,
          spent,
          percentage,
          threshold: budget.notifications?.email?.threshold || 80
        });
      }
    }

    console.log('Alerts generated:', alerts);

    if (alerts.length > 0) {
      res.json({ 
        message: `Found ${alerts.length} budget alerts`,
        alerts: alerts 
      });
    } else {
      res.json({ 
        message: 'No budget alerts needed',
        alerts: [] 
      });
    }
  } catch (error) {
    console.error('Error checking budget alerts:', error);
    res.status(500).json({ error: 'Failed to check budget alerts' });
  }
});

// Update alert settings for a specific budget
router.put('/:id/alerts', auth, async (req, res) => {
  try {
    const { enabled, threshold } = req.body;
    
    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    
    budget.notifications.email.enabled = enabled;
    budget.notifications.email.threshold = threshold;
    
    await budget.save();
    res.json(budget);
  } catch (error) {
    console.error('Error updating alert settings:', error);
    res.status(500).json({ error: 'Failed to update alert settings' });
  }
});

module.exports = router; 