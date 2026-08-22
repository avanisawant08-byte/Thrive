const Activity = require('../models/Activity');
const User = require('../models/User');

// @desc    Get platform-wide public stats
// @route   GET /v1/stats/platform
// @access  Public
const getPlatformStats = async (req, res) => {
  try {
    const [totalActivities, totalUsers, coinsResult] = await Promise.all([
      Activity.countDocuments({ status: 'approved' }),
      User.countDocuments({ role: 'user' }),
      Activity.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, totalCoins: { $sum: '$coinsAwarded' } } }
      ])
    ]);

    const totalCoins = coinsResult.length > 0 ? coinsResult[0].totalCoins : 0;

    res.json({
      totalActivities,
      totalCoins,
      activeMembers: totalUsers,
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

module.exports = { getPlatformStats };
