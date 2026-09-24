const mongoose = require('mongoose');

const userNotificationPreferencesSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  eventCancellations: { type: Boolean, default: true },
  eventReminders: { type: Boolean, default: true },
  joinRequestUpdates: { type: Boolean, default: true },
  eventUpdates: { type: Boolean, default: true },
  newEventsNearby: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('UserNotificationPreferences', userNotificationPreferencesSchema);
