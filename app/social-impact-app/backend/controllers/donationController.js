const Donation = require('../models/Donation');
const NGO = require('../models/NGO');
const User = require('../models/User');

// @desc Submit a donation (User side)
// @route POST /api/donations
const submitDonation = async (req, res) => {
  try {
    const { ngoId, donationType, quantityOrAmount, message, proofMedia, isBirthdayDonation, isReliefDonation } = req.body;

    const donation = await Donation.create({
      userId: req.user._id,
      ngoId,
      donationType,
      quantityOrAmount,
      message,
      proofMedia: proofMedia || [],
      status: 'proof_submitted',
      isBirthdayDonation,
      isReliefDonation
    });

    res.status(201).json({ message: 'Donation submitted! Wait for NGO to verify.', donation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get user's own donations
// @route GET /api/donations/my
const getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ userId: req.user._id })
      .populate('ngoId', 'name logo')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get pending donations for NGO
// @route GET /api/ngo/donations/pending
const getNGOPendingDonations = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ userId: req.user._id });
    if (!ngo) return res.status(404).json({ message: 'NGO profile not found' });

    const donations = await Donation.find({ ngoId: ngo._id })
      .populate('userId', 'name profilePhoto')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Confirm or reject donation (NGO side)
// @route PUT /api/ngo/donations/:id/confirm (or reject)
const handleDonationAction = async (req, res) => {
  try {
    const { id, action } = req.params; // action = 'confirm' or 'reject'
    const donation = await Donation.findById(id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    // Verify this NGO owns this donation
    const ngo = await NGO.findOne({ userId: req.user._id });
    if (donation.ngoId.toString() !== ngo._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (action === 'confirm') {
      donation.status = 'verified';
      // Optionally award coins to user
      const rewardAmount = 100; // Reward for donation
      await User.findByIdAndUpdate(donation.userId, { $inc: { coinBalance: rewardAmount } });
    } else {
      donation.status = 'rejected';
    }

    donation.reviewedAt = new Date();
    await donation.save();

    res.json({ message: `Donation ${donation.status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get NGO donation stats
// @route GET /api/ngo/donations/stats
const getNGODonationStats = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ userId: req.user._id });
    if (!ngo) return res.status(404).json({ message: 'NGO profile not found' });

    const totalDonationsReceived = await Donation.countDocuments({ ngoId: ngo._id, status: 'verified' });
    const monetaryReceived = await Donation.aggregate([
      { $match: { ngoId: ngo._id, status: 'verified', donationType: { $in: ['monetary', 'online_monetary'] } } },
      { $group: { _id: null, total: { $sum: { $toDouble: "$quantityOrAmount" } } } }
    ]);

    res.json({
      totalDonationsReceived,
      monetaryReceived: monetaryReceived[0]?.total || 0,
      totalItemsCollected: 'Various' // Hard to aggregate mixed units like '10kg' and '5 shirts'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitDonation,
  getMyDonations,
  getNGOPendingDonations,
  handleDonationAction,
  getNGODonationStats
};
