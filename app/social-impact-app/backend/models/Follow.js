const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  followingId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'followingModel'
  },
  followingType: {
    type: String,
    enum: ['user', 'ngo'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'rejected'],
    default: 'active'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  }
}, { timestamps: true });

followSchema.virtual('followingModel').get(function() {
  return this.followingType === 'ngo' ? 'NGO' : 'User';
});

followSchema.set('toJSON', { virtuals: true });
followSchema.set('toObject', { virtuals: true });

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

module.exports = mongoose.model('Follow', followSchema);
