const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const joinRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  rejectionReason: { type: String }
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  activityType: {
    type: String,
    enum: ['blood_donation', 'tree_plantation', 'volunteering', 'other'],
    required: true
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO' }, // NGO that created the event
  volunteersNeeded: { type: Number, default: 0 },
  joinPolicy: { type: String, enum: ['open', 'approval'], default: 'open' },
  joinRequests: [joinRequestSchema],
  certificateAvailable: { type: Boolean, default: false },
  eventImage: { type: String, default: '' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  address: { type: String, required: true },
  date: { type: Date, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ['pending_approval', 'upcoming', 'ongoing', 'completed', 'cancelled', 'rejected'],
    default: 'upcoming'
  },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  cancellationMessage: { type: String },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  isPinned: { type: Boolean, default: false },
  pinnedAt: { type: Date },
  isApproved: { type: Boolean, default: false },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  coinsReward: { type: Number, default: 50 },
  duration: { type: Number, default: 1 }, // hours
  endTime: { type: Date },
}, { timestamps: true });

eventSchema.index({ location: '2dsphere' });
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ ngoId: 1, createdAt: -1 });
eventSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Event', eventSchema);