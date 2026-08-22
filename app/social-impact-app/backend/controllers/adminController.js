const NGO = require('../models/NGO');
const User = require('../models/User');
const Event = require('../models/Event');
const Notification = require('../models/Notification');

// @desc Get all pending NGO registration requests
// @route GET /api/admin/ngos/pending
const getPendingNGOs = async (req, res) => {
  try {
    const pendingNGOs = await NGO.find({ isVerified: false }).populate('userId', 'name email');
    res.json(pendingNGOs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Verify (approve/reject) NGO registration
// @route PUT /api/admin/ngos/:id/verify
const verifyNGO = async (req, res) => {
  try {
    const { status } = req.body; // status: 'approved' or 'rejected'
    const ngo = await NGO.findById(req.params.id);

    if (!ngo) return res.status(404).json({ message: 'NGO application not found' });

    if (status === 'approved') {
      ngo.isVerified = true;
      await ngo.save();

      // Update user role to 'ngo'
      await User.findByIdAndUpdate(ngo.userId, { role: 'ngo' });

      res.json({ message: 'NGO approved and role updated successfully!', ngo });
    } else {
      await ngo.deleteOne();
      res.json({ message: 'NGO registration rejected and application removed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEconomyStats = async (req, res) => {
  try {
    const users = await User.find({});
    let totalCirculatingCoins = 0;
    users.forEach(u => {
      totalCirculatingCoins += (u.coinBalance || 0);
    });
    
    res.json({
      totalUsers: users.length,
      totalCirculatingCoins,
      activeUsers: users.filter(u => u.coinBalance > 0).length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all pending community events
// @route GET /api/admin/events/pending
const getPendingEvents = async (req, res) => {
  try {
    const pendingEvents = await Event.find({ isApproved: false }).populate('createdBy', 'name email');
    res.json(pendingEvents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Verify (approve/reject) community event
// @route PUT /api/admin/events/:id/verify
const verifyEvent = async (req, res) => {
  try {
    const { status } = req.body; // status: 'approved' or 'rejected'
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (status === 'approved') {
      event.isApproved = true;
      event.status = 'upcoming'; // Set to upcoming when approved
      await event.save();

      // Notify the user that their event is approved
      await Notification.create({
        userId: event.createdBy,
        type: 'event_approved', // Requires this type in Notification schema if enum is strict
        referenceId: event._id,
        message: `🎉 Your community event "${event.title}" has been approved and launched!`,
        isRead: false
      });

      res.json({ message: 'Event approved successfully!', event });
    } else {
      event.status = 'rejected';
      await event.save();

      // Notify the user that their event is rejected
      await Notification.create({
        userId: event.createdBy,
        type: 'event_rejected', // Requires this type in Notification schema if enum is strict
        referenceId: event._id,
        message: `❌ Your community event "${event.title}" was rejected by the admin.`,
        isRead: false
      });

      res.json({ message: 'Event application rejected' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPendingNGOs,
  verifyNGO,
  getEconomyStats,
  getPendingEvents,
  verifyEvent
};
