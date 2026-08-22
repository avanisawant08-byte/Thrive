const express = require('express');
const router = express.Router();
const {
  getPendingNGOs,
  verifyNGO,
  getEconomyStats,
  getPendingEvents,
  verifyEvent
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/ngos/pending', protect, adminOnly, getPendingNGOs);
router.put('/ngos/:id/verify', protect, adminOnly, verifyNGO);
router.get('/economy', protect, adminOnly, getEconomyStats);
router.get('/events/pending', protect, adminOnly, getPendingEvents);
router.put('/events/:id/verify', protect, adminOnly, verifyEvent);

module.exports = router;
