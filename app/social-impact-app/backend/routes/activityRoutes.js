const express = require('express');
const router = express.Router();
const {
  submitActivity,
  getMyActivities,
  getActivityById,
  updateActivityStatus,
  getPendingActivities,
  getNearbyActivities
} = require('../controllers/activityController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.post('/', protect, upload.array('proofMedia', 5), submitActivity);
router.get('/me', protect, getMyActivities);
router.get('/pending', protect, getPendingActivities);
router.get('/nearby', getNearbyActivities);
router.get('/:id', protect, getActivityById);
router.put('/:id/status', protect, updateActivityStatus);

module.exports = router;