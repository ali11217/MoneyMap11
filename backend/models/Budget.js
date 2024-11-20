const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  notifications: {
    email: {
      enabled: { type: Boolean, default: true },
      threshold: { type: Number, default: 80 },
      lastSent: { type: Date }
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('budget', BudgetSchema); 