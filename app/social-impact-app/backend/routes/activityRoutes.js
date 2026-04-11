const express = require('express');
const router = express.Router();
const {
  submitActivity,
  getMyActivities,
  getActivityById,
  updateActivityStatus,
  getPendingActivities
} = require('../controllers/activityController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const multer = require('multer');

// Multer — memory storage (no local files)
const upload = multer({ storage: multer.memoryStorage() });

// POST /activities — Submit activity (URLs already uploaded to Firebase from frontend)
router.post('/', protect, upload.none(), submitActivity);

// GET /activities/me — Get my activities
router.get('/me', protect, getMyActivities);

// GET /activities/pending — Admin only
router.get('/pending', protect, adminOnly, getPendingActivities);

// GET /activities/:id — Get single activity
router.get('/:id', protect, getActivityById);

// PUT /activities/:id/status — Admin approve/reject
router.put('/:id/status', protect, adminOnly, updateActivityStatus);

module.exports = router;