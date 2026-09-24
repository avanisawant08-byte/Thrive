const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: {
    type: String,
    enum: [
      'new_event', 'new_post', 'milestone', 'event_proof_request',
      'event_cancelled', 'event_updated', 'event_reminder_24h', 
      'event_reminder_1h', 'request_approved', 'request_rejected', 
      'event_approved', 'event_rejected', 'event_full', 'event_completed', 
      'new_volunteer', 'new_follower', 'follow_request', 'follow_request_approved',
      'post_liked', 'post_commented', 'user_mention'
    ],
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  ngoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'NGO', 
    required: false 
  },
  referenceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: false 
  }, // Post ID or Event ID
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: false
  },
  message: { 
    type: String, 
    required: true 
  },
  subMessage: {
    type: String,
    required: false
  },
  isRead: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
