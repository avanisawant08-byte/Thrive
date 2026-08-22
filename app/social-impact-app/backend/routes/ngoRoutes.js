const express = require('express');
const router = express.Router();
const {
  registerNGO,
  getNGOProfile,
  updateNGOProfile,
  getVolunteerProfile,
  getNGOAnalytics,
  getPublicNGOProfile,
  getAllNGOs,
  createNGOEvent,
  getNGOEvents,
  updateNGOEvent,
  deleteNGOEvent,
  getEventJoinRequests,
  handleJoinRequest,
  getNGODashboard,
} = require('../controllers/ngoController');
const {
  getNGOPendingDonations,
  handleDonationAction,
  getNGODonationStats
} = require('../controllers/donationController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const NGO = require('../models/NGO');

// Profile & Auth
router.get('/', getAllNGOs);
router.post('/register', protect, registerNGO);
router.get('/profile', protect, getNGOProfile);
router.put('/profile', protect, updateNGOProfile);
router.get('/dashboard', protect, getNGODashboard);
router.get('/volunteers/:userId/profile', protect, getVolunteerProfile);
router.get('/analytics', protect, getNGOAnalytics);

// Events
router.post('/events', protect, createNGOEvent);
router.get('/events', protect, getNGOEvents);
router.put('/events/:id', protect, updateNGOEvent);
router.delete('/events/:id', protect, deleteNGOEvent);
router.get('/events/:id/requests', protect, getEventJoinRequests);
router.put('/events/:id/requests/:userId', protect, handleJoinRequest);
 
// Donations (NGO Side)
router.get('/donations/pending', protect, getNGOPendingDonations);
router.get('/donations/stats', protect, getNGODonationStats);
router.put('/donations/:id/:action', protect, handleDonationAction); // action: confirm/reject

// Public NGO Profile View
router.get('/:id/public', getPublicNGOProfile);

// Upload event banner image to Cloudinary
router.post('/upload-image', protect, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ url: req.file.path });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

