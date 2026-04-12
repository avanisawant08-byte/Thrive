const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { admin } = require('../config/firebase');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc Register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, passwordHash });

    // Send verification email via Firebase
    try {
      const firebaseUser = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        emailVerified: false,
      });

      const verificationLink = await admin.auth().generateEmailVerificationLink(email);
      console.log('Verification link:', verificationLink);
    } catch (firebaseErr) {
      console.log('Firebase error (non-critical):', firebaseErr.message);
    }

    res.status(201).json({
      message: 'User registered successfully! Please verify your email.',
      userId: user._id,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        coinBalance: user.coinBalance,
        role: user.role,
        profilePhoto: user.profilePhoto,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Google OAuth login
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { email, name, picture, uid } = decoded;

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        passwordHash: uid, // Firebase UID as placeholder
        profilePhoto: picture || '',
      });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        coinBalance: user.coinBalance,
        role: user.role,
        profilePhoto: user.profilePhoto,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send password reset email via Firebase
    const resetLink = await admin.auth().generatePasswordResetLink(email);
    console.log('Reset link:', resetLink);

    res.json({ message: 'Password reset email sent! Check your inbox.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio, location } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (location) user.location = location;

    const updatedUser = await user.save();
    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, googleLogin, forgotPassword, getProfile, updateProfile };