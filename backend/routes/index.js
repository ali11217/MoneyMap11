const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/budgets', require('./budgets'));
router.use('/expenses', require('./expenses'));
router.use('/settings', require('./settings'));
router.use('/savings-goals', require('./savingsGoals'));

module.exports = router; 