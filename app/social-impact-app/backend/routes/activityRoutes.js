const express = require('express');
const router = express.Router();
const {
  submitActivity, getMyActivities, getActivityById,
  updateActivityStatus, getPendingActivities
} = require('../controllers/activityController');
const { protect, adminOnly } = require('../controllers/authMiddleware');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

router.post('/', protect, upload.array('proofMedia', 5), submitActivity);
router.get('/me', protect, getMyActivities);
router.get('/pending', protect, adminOnly, getPendingActivities);
router.get('/:id', protect, getActivityById);
router.put('/:id/status', protect, adminOnly, updateActivityStatus);

module.exports = router;