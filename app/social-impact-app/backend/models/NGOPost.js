const mongoose = require('mongoose');

const ngoPostSchema = new mongoose.Schema({
  ngoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'NGO', 
    required: true 
  },
  type: {
    type: String,
    enum: ['general', 'event_announcement'],
    required: true
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 500
  },
  imageUrl: { 
    type: String, 
    default: "" 
  },
  link: { 
    type: String, 
    default: "" 
  },
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event',
    default: null
  },
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

module.exports = mongoose.model('NGOPost', ngoPostSchema);
