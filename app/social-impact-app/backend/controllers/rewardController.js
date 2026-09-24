const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc Get coin balance
const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('coinBalance');
    res.json({ coinBalance: user.coinBalance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get transaction history
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { scope = 'global', period = 'alltime', city } = req.query;

    let matchQuery = {};
    if (period === 'weekly') {
      matchQuery.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (period === 'monthly') {
      matchQuery.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    const leaderboard = await User.find({ role: 'user' })
      .select('name profilePhoto coinBalance location')
      .sort({ coinBalance: -1 })
      .limit(50);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBalance, getTransactions, getLeaderboard };