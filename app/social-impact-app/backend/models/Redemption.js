const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  couponCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'redeemed', 'expired'],
    default: 'active'
  },
  shopkeeperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  redeemedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Redemption', redemptionSchema);
