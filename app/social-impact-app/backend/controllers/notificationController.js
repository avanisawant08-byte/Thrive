const Notification = require('../models/Notification');
const UserNotificationPreferences = require('../models/UserNotificationPreferences');

// @desc Get user notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .populate('ngoId', 'name logo')
      .populate('eventId', 'title startDate location address status')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get unread notifications count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification || notification.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    notification.isRead = true;
    await notification.save();
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification || notification.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    await notification.deleteOne();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get user notification preferences
const getPreferences = async (req, res) => {
  try {
    let prefs = await UserNotificationPreferences.findOne({ userId: req.user._id });
    if (!prefs) {
      prefs = await UserNotificationPreferences.create({ userId: req.user._id });
    }
    res.json(prefs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update user notification preferences
const updatePreferences = async (req, res) => {
  try {
    const prefs = await UserNotificationPreferences.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, upsert: true }
    );
    res.json(prefs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences
};
