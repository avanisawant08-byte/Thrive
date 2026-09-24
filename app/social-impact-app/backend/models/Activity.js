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
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  }
}, { timestamps: true });

activitySchema.index({ location: '2dsphere' });
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ status: 1, createdAt: -1 });
activitySchema.index({ eventId: 1 });

module.exports = mongoose.model('Activity', activitySchema);