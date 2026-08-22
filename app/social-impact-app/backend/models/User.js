const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  profilePhoto: { type: String, default: '' },
  bio: { type: String, default: '' },

  // New fields
  dateOfBirth: { type: Date, default: null },
  city: { type: String, default: '' },
  institute: { type: String, default: '' },
  occupation: { type: String, default: '' },
  phone: { type: String, default: '' },
  website: { type: String, default: '' },
  instagram: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  interests: [{
    type: String
  }],

  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  coinBalance: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin', 'shopkeeper', 'ngo'], default: 'user' },
  shopDetails: {
    shopName: { type: String, default: '' },
    category: { type: String, enum: ['cafe', 'hotel', 'restaurant', 'retail', 'other', ''], default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    logo: { type: String, default: '' }
  },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPrivate: { type: Boolean, default: false },
  followerCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  postCount: { type: Number, default: 0 },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true }
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Virtual field - age calculate karo
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);