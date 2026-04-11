const Activity = require('../models/Activity');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc Submit activity
const submitActivity = async (req, res) => {
  try {
    const { activityType, eventId, description } = req.body;

    // proofMedia URLs already uploaded to Firebase from frontend
    let proofMedia = req.body.proofMedia || [];
    if (typeof proofMedia === 'string') proofMedia = [proofMedia];

    const activity = await Activity.create({
      userId: req.user._id,
      activityType,
      eventId: eventId || null,
      description,
      proofMedia,
    });

    res.status(201).json({ message: 'Activity submitted successfully', activity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get my activities
const getMyActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.user._id })
      .populate('eventId', 'title address date')
      .sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get activity by id
const getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('userId', 'name profilePhoto')
      .populate('eventId', 'title address date');
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update activity status (Admin)
const updateActivityStatus = async (req, res) => {
  try {
    const { status, coinsAwarded } = req.body;
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    activity.status = status;
    activity.reviewedBy = req.user._id;
    activity.reviewedAt = new Date();

    if (status === 'approved' && coinsAwarded) {
      activity.coinsAwarded = coinsAwarded;

      await User.findByIdAndUpdate(activity.userId, {
        $inc: { coinBalance: coinsAwarded }
      });

      await Transaction.create({
        userId: activity.userId,
        type: 'earned',
        amount: coinsAwarded,
        source: 'activity_approval',
        referenceId: activity._id,
      });
    }

    await activity.save();
    res.json({ message: `Activity ${status}`, activity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get pending activities (Admin)
const getPendingActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ status: 'pending' })
      .populate('userId', 'name email profilePhoto')
      .populate('eventId', 'title')
      .sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitActivity,
  getMyActivities,
  getActivityById,
  updateActivityStatus,
  getPendingActivities
};