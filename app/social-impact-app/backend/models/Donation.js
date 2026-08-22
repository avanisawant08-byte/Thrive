const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
  donationType: { 
    type: String, 
    enum: ['food', 'clothes', 'necessities', 'monetary', 'online_monetary'], 
    required: true 
  },
  quantityOrAmount: { type: String, required: true }, // e.g. "10kg", "5 shirts", "₹500"
  message: { type: String, default: '' },
  proofMedia: [{ type: String }], // URLs to images
  status: { 
    type: String, 
    enum: ['pending', 'proof_submitted', 'verified', 'rejected'], 
    default: 'pending' 
  },
  isBirthdayDonation: { type: Boolean, default: false },
  isReliefDonation: { type: Boolean, default: false },
  reviewedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);
