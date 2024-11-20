const SavingsGoal = require('../models/SavingsGoal');
const { validationResult, check } = require('express-validator');
const mongoose = require('mongoose');

// Validation middleware
const validateSavingsGoal = [
  check('title').trim().notEmpty().withMessage('Title is required'),
  check('targetAmount').isNumeric().withMessage('Target amount must be a number'),
  check('currentAmount').isNumeric().withMessage('Current amount must be a number'),
  check('deadline').optional().isISO8601().toDate(),
  check('category').optional().trim()
];

// Export validation middleware
exports.validateSavingsGoal = validateSavingsGoal;

exports.getGoals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [goals, total] = await Promise.all([
      SavingsGoal.find({ user: req.user.id })
        .sort({ deadline: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SavingsGoal.countDocuments({ user: req.user.id })
    ]);

    res.json({
      goals: goals || [],
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching goals:', err);
    res.status(500).json({ 
      error: 'Server Error',
      goals: []
    });
  }
};

exports.createGoal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, targetAmount, currentAmount, deadline, category, notes } = req.body;

    const newGoal = new SavingsGoal({
      user: req.user.id,
      title,
      targetAmount,
      currentAmount,
      deadline,
      category,
      notes,
      status: currentAmount >= targetAmount ? 'Completed' : 'In Progress'
    });

    const goal = await newGoal.save();
    res.json(goal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const { title, targetAmount, currentAmount, deadline, category, notes } = req.body;
    
    let goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ msg: 'Goal not found' });
    }

    // Make sure user owns goal
    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Update status based on current amount
    const status = currentAmount >= targetAmount ? 'Completed' : 'In Progress';

    goal = await SavingsGoal.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          title,
          targetAmount,
          currentAmount,
          deadline,
          category,
          notes,
          status
        }
      },
      { new: true }
    );

    res.json(goal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ msg: 'Goal not found' });
    }

    // Make sure user owns goal
    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await goal.deleteOne();

    res.json({ msg: 'Goal removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { currentAmount } = req.body;
    
    let goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ msg: 'Goal not found' });
    }

    // Make sure user owns goal
    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Update status based on current amount
    const status = currentAmount >= goal.targetAmount ? 'Completed' : 'In Progress';

    goal = await SavingsGoal.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status
        }
      },
      { new: true }
    );

    res.json(goal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}; 