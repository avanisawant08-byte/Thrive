const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'authorModel'
  },
  authorType: {
    type: String,
    enum: ['user', 'ngo'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  mediaUrls: [{
    type: String
  }],
  imageUrl: {
    type: String,
    default: ''
  },
  locationTag: {
    type: String,
    default: ''
  },
  locationCoords: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  visibility: {
    type: String,
    enum: ['public', 'followers_only'],
    default: 'public'
  },
  linkedEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, { timestamps: true });

postSchema.virtual('authorModel').get(function() {
  return this.authorType === 'ngo' ? 'NGO' : 'User';
});

postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ isDeleted: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1 });

postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);
