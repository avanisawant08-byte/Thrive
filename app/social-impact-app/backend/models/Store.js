const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['coupon', 'discount', 'product'],
    required: true
  },
  coinCost: { type: Number, required: true },
  imageUrl: { type: String, default: '' },
  stock: { type: Number, default: -1 },
  isActive: { type: Boolean, default: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);