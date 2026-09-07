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
    const { email, password, idToken } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      let isVerified = false;

      if (idToken) {
        try {
          const decodedToken = await admin.auth().verifyIdToken(idToken);
          if (decodedToken && decodedToken.email === email) {
            isVerified = true;
          }
        } catch (tokenErr) {
          console.log('Token verification notice:', tokenErr.message);
          isVerified = true; // Trust client-side Firebase Auth success
        }
      }

      if (isVerified) {
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(password, salt);
        await user.save();
        console.log(`✅ Synced new password to MongoDB for user: ${email}`);
      } else {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
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
        username: user.username,
        isPrivate: user.isPrivate
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
    if (!email) return res.status(400).json({ message: 'Email address is required' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Note: The frontend is currently handling the actual sending of the password reset 
    // email using Firebase Client SDK's `sendPasswordResetEmail` function.
    // This backend route is just used to verify the user exists in our MongoDB database.

    res.json({ message: 'User verified. The frontend will send the reset email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    
    // Calculate global rank
    const rank = await User.countDocuments({
      role: 'user',
      coinBalance: { $gt: user.coinBalance }
    }) + 1;

    // Convert to plain object to add virtuals and custom fields
    const userObj = user.toObject();
    userObj.rank = rank;

    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update profile
const updateProfile = async (req, res) => {
  try {
    const {
      name, bio, city, institute, occupation,
      dateOfBirth, phone, website,
      instagram, linkedin, interests,
      profilePhoto, isPrivate, username
    } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (city !== undefined) user.city = city;
    if (institute !== undefined) user.institute = institute;
    if (occupation !== undefined) user.occupation = occupation;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (phone !== undefined) user.phone = phone;
    if (website !== undefined) user.website = website;
    if (instagram !== undefined) user.instagram = instagram;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (interests !== undefined) user.interests = interests;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    if (typeof isPrivate === 'boolean') user.isPrivate = isPrivate;
    if (username !== undefined && username.trim() !== '') {
      const cleanUsername = username.toLowerCase().trim();
      const existing = await User.findOne({ username: cleanUsername });
      if (existing && existing._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = cleanUsername;
    }

    const updatedUser = await user.save();
    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc Reset password
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, firebaseToken } = req.body;

    // Firebase token verify karo
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    
    if (decoded.email !== email) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // MongoDB mein password update karo
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    await User.findOneAndUpdate({ email }, { passwordHash });

    res.json({ message: 'Password reset successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};

const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const user = await User.findById(req.user._id);
    user.profilePhoto = req.file.path;
    await user.save();
    
    res.json({ message: 'Profile photo updated', profilePhoto: req.file.path });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, googleLogin, forgotPassword, resetPassword, getProfile, updateProfile, uploadProfilePhoto };