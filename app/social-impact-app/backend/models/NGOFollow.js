const mongoose = require('mongoose');

const ngoFollowSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  ngoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'NGO', 
    required: true 
  },
  notificationPreference: {
    type: String,
    enum: ['all', 'events_only', 'muted'],
    default: 'all'
  },
  followedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Ensure unique follow pair
ngoFollowSchema.index({ userId: 1, ngoId: 1 }, { unique: true });

module.exports = mongoose.model('NGOFollow', ngoFollowSchema);
