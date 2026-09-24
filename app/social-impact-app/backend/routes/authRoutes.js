const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin, forgotPassword, resetPassword, getProfile, updateProfile, uploadProfilePhoto } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
router.put('/profile/photo', protect, upload.single('profilePhoto'), uploadProfilePhoto);

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;