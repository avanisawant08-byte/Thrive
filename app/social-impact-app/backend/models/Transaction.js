const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['earned', 'spent'],
    required: true
  },
  amount: { type: Number, required: true },
  source: {
    type: String,
    enum: ['activity_approval', 'store_redemption', 'event_completion'],
    required: true
  },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);