const Activity = require('../models/Activity');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Event = require('../models/Event');

// @desc Submit activity
const submitActivity = async (req, res) => {
  try {
    const { activityType, eventId, description, latitude, longitude } = req.body;

    // Cloudinary se uploaded file URLs lo
    const proofMedia = req.files ? req.files.map(f => f.path) : [];

    let location = undefined;
    if (latitude && longitude) {
      location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    let coinsAwarded = 0;
    if (eventId) {
      const eventObj = await Event.findById(eventId);
      if (eventObj && !eventObj.ngoId && eventObj.createdBy.toString() === req.user._id.toString()) {
        coinsAwarded = 500;
      }
    }

    const activity = await Activity.create({
      userId: req.user._id,
      activityType,
      eventId: eventId || null,
      description,
      proofMedia,
      location,
      coinsAwarded
    });

    res.status(201).json({ message: 'Activity submitted successfully', activity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get my activities
const getMyActivities = async (req, res) => {
  try {
    // Backfill: Ensure activities exist for completed events the user participated in
    const joinedCompletedEvents = await Event.find({
      status: 'completed',
      participants: req.user._id
    });

    for (const event of joinedCompletedEvents) {
      const exists = await Activity.findOne({ userId: req.user._id, eventId: event._id });
      if (!exists) {
        await Activity.create({
          userId: req.user._id,
          eventId: event._id,
          activityType: event.activityType,
          description: `Participated in event: ${event.title}`,
          status: 'approved',
          coinsAwarded: event.coinsReward,
          reviewedAt: new Date()
        });
      }
    }

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

// @desc Update activity status (Admin or NGO)
const updateActivityStatus = async (req, res) => {
  try {
    const { status, coinsAwarded } = req.body;
    const activity = await Activity.findById(req.params.id).populate('eventId');
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    // Authorization check
    if (req.user.role !== 'admin') {
      if (req.user.role !== 'ngo') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      if (!activity.eventId || activity.eventId.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized for this event' });
      }
    }

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

// @desc Get pending activities (Admin or NGO)
const getPendingActivities = async (req, res) => {
  try {
    let query = { status: 'pending' };

    if (req.user.role === 'ngo') {
      const events = await Event.find({ createdBy: req.user._id }).select('_id');
      const eventIds = events.map(e => e._id);
      query.eventId = { $in: eventIds };
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const activities = await Activity.find(query)
      .populate('userId', 'name email profilePhoto')
      .populate('eventId', 'title')
      .sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get nearby activities
const getNearbyActivities = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, category } = req.query;
    
    // Show both approved and pending activities to make testing and real-time mapping work seamlessly
    let query = { status: { $in: ['approved', 'pending'] } };

    if (latitude && longitude) {
      const radiusInMeters = parseFloat(radius) * 1000;
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: radiusInMeters
        }
      };
    }

    if (category && category !== 'All') {
      let dbType = category;
      if (category === 'Blood Donation') dbType = 'blood_donation';
      else if (category === 'Tree Plant') dbType = 'tree_plantation';
      else if (category === 'Volunteering') dbType = 'volunteering';
      query.activityType = dbType;
    }

    const activities = await Activity.find(query)
      .populate('userId', 'name profilePhoto')
      .populate('eventId', 'title');
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
  getPendingActivities,
  getNearbyActivities
};