const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const savingsGoalController = require('../controllers/savingsGoalController');

// @route   GET api/savings-goals
router.get('/', auth, savingsGoalController.getGoals);

// @route   POST api/savings-goals
router.post('/', [auth, savingsGoalController.validateSavingsGoal], savingsGoalController.createGoal);

// @route   PUT api/savings-goals/:id
router.put('/:id', [auth, savingsGoalController.validateSavingsGoal], savingsGoalController.updateGoal);

// @route   DELETE api/savings-goals/:id
router.delete('/:id', auth, savingsGoalController.deleteGoal);

module.exports = router; 