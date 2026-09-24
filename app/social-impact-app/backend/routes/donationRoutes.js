const express = require('express');
const router = express.Router();
const {
  submitDonation,
  getMyDonations
} = require('../controllers/donationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, submitDonation);
router.get('/my', protect, getMyDonations);

module.exports = router;
