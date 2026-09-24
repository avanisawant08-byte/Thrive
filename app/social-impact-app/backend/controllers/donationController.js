const Donation = require('../models/Donation');
const NGO = require('../models/NGO');
const User = require('../models/User');

// @desc Submit a donation (User side)
// @route POST /api/donations
const submitDonation = async (req, res) => {
  try {
    const { ngoId, donationType, quantityOrAmount, message, proofMedia, isBirthdayDonation, isReliefDonation } = req.body;

    if (!ngoId || !donationType || !quantityOrAmount) {
      return res.status(400).json({ message: 'NGO, donation type, and quantity/amount are required' });
    }

    const targetNgo = await NGO.findById(ngoId);
    if (!targetNgo) {
      return res.status(404).json({ message: 'NGO not found' });
    }

    const donation = await Donation.create({
      userId: req.user._id,
      ngoId,
      donationType,
      quantityOrAmount: String(quantityOrAmount).slice(0, 100),
      message: message ? String(message).slice(0, 1000) : '',
      proofMedia: Array.isArray(proofMedia) ? proofMedia.slice(0, 10) : [],
      status: 'proof_submitted',
      isBirthdayDonation: !!isBirthdayDonation,
      isReliefDonation: !!isReliefDonation
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
    if (!['confirm', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be confirm or reject' });
    }

    const donation = await Donation.findById(id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    // Verify this NGO owns this donation
    const ngo = await NGO.findOne({ userId: req.user._id });
    if (!ngo || donation.ngoId.toString() !== ngo._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this donation' });
    }

    if (action === 'confirm') {
      if (donation.status === 'verified') {
        return res.status(400).json({ message: 'Donation has already been verified' });
      }
      donation.status = 'verified';
      // Award coins to user only once
      const rewardAmount = 100;
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
