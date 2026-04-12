const express = require('express');
const router = express.Router();
const { getBalance, getTransactions, getLeaderboard } = require('../controllers/rewardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/balance', protect, getBalance);
router.get('/transactions', protect, getTransactions);
router.get('/leaderboard', getLeaderboard);

module.exports = router;