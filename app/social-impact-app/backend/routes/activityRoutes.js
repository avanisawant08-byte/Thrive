const express = require('express');
const router = express.Router();
const { submitActivity, getMyActivities, getActivityById, updateActivityStatus, getPendingActivities } = require('../controllers/activityController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const multer = require('multer');
const { bucket } = require('../config/firebase');

// Multer — memory storage (file buffer Firebase pe jayega)
const upload = multer({ storage: multer.memoryStorage() });

// Firebase upload helper
const uploadToFirebase = async (file) => {
  const fileName = `proofs/${Date.now()}-${file.originalname}`;
  const fileUpload = bucket.file(fileName);

  await fileUpload.save(file.buffer, {
    metadata: { contentType: file.mimetype },
    public: true,
  });

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
};

// POST /activities — Submit with Firebase upload
router.post('/', protect, upload.array('proofMedia', 5), async (req, res) => {
  try {
    const urls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToFirebase(file);
        urls.push(url);
      }
    }

    req.body.proofMedia = urls;
    return submitActivity(req, res);
  } catch (error) {
    res.status(500).json({ message: 'Upload failed: ' + error.message });
  }
});

router.get('/me', protect, getMyActivities);
router.get('/pending', protect, adminOnly, getPendingActivities);
router.get('/:id', protect, getActivityById);
router.put('/:id/status', protect, adminOnly, updateActivityStatus);

module.exports = router;