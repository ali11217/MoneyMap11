router.post('/check-alerts', auth, async (req, res) => {
  try {
    const { checkBudgetThresholds } = require('../utils/budgetAlerts');
    const alerts = await checkBudgetThresholds(req.user.id);
    
    if (alerts.length > 0) {
      const { sendBudgetAlert } = require('../services/notificationService');
      for (const alert of alerts) {
        await sendBudgetAlert(req.user.id, alert);
      }
      res.json({ message: `Sent ${alerts.length} budget alerts` });
    } else {
      res.json({ message: 'No budget alerts needed' });
    }
  } catch (error) {
    console.error('Error checking budget alerts:', error);
    res.status(500).json({ error: 'Failed to check budget alerts' });
  }
}); 