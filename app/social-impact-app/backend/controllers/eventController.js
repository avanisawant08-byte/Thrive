const Event = require('../models/Event');

// @desc Get all events (with location filter)
const getEvents = async (req, res) => {
  try {
    const { lat, lng, radius = 10000, type } = req.query;
    let query = {};

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      };
    }

    if (type) query.activityType = type;

    const events = await Event.find(query).populate('createdBy', 'name profilePhoto');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create event
const createEvent = async (req, res) => {
  try {
    const { title, description, activityType, location, address, date, coinsReward } = req.body;

    const event = await Event.create({
      title, description, activityType, location,
      address, date, coinsReward,
      createdBy: req.user._id
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get single event
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name profilePhoto')
      .populate('participants', 'name profilePhoto');

    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update event
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete event
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Join event
const joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already joined' });
    }

    event.participants.push(req.user._id);
    await event.save();
    res.json({ message: 'Joined event successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Leave event
const leaveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.participants = event.participants.filter(
      p => p.toString() !== req.user._id.toString()
    );
    await event.save();
    res.json({ message: 'Left event successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Add comment
const addComment = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.comments.push({ user: req.user._id, text: req.body.text });
    await event.save();
    res.status(201).json({ message: 'Comment added' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get comments
const getComments = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('comments.user', 'name profilePhoto');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getEvents, createEvent, getEventById, updateEvent, deleteEvent, joinEvent, leaveEvent, addComment, getComments };