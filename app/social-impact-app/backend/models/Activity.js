const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
  activityType: {
    type: String,
    enum: ['blood_donation', 'tree_plantation', 'volunteering', 'other'],
    required: true
  },
  proofMedia: [{ type: String }],
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  coinsAwarded: { type: Number, default: 0 },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);