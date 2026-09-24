const Event = require('../models/Event');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Activity = require('../models/Activity');
const NGOFollow = require('../models/NGOFollow');
const NGOPost = require('../models/NGOPost');
const Notification = require('../models/Notification');
const NGO = require('../models/NGO');

// Internal helper to complete events that have ended
const autoCompleteEvents = async () => {
  try {
    const now = new Date();
    const events = await Event.find({ status: { $ne: 'completed' }, isApproved: true });
    
    for (const event of events) {
      const start = event.startDate || event.date;
      const durationMs = (event.duration || 1) * 60 * 60 * 1000;
      const end = event.endDate || event.endTime || new Date(start.getTime() + durationMs);
      
      if (end < now) {
        event.status = 'completed';
        await event.save();

        // Send proof request notification to community event host
        if (!event.ngoId) {
          const notificationExists = await Notification.findOne({
            userId: event.createdBy,
            type: 'event_proof_request',
            referenceId: event._id
          });
          if (!notificationExists) {
            await Notification.create({
              userId: event.createdBy,
              type: 'event_proof_request',
              referenceId: event._id,
              message: `🎉 Your community event "${event.title}" is complete! Please submit proofs to claim your ${event.coinsReward || 500} coins reward.`,
              isRead: false
            });
          }
        }

        // Distribute coins to participants
        for (const userId of event.participants) {
          const user = await User.findById(userId);
          if (user) {
            // Record transaction only if not already done for this event
            const txExists = await Transaction.findOne({ userId: user._id, referenceId: event._id, source: 'event_completion' });
            if (!txExists) {
              const rewardAmount = event.coinsReward || 0;
              await User.findByIdAndUpdate(user._id, { $inc: { coinBalance: rewardAmount } });

              await Transaction.create({
                userId: user._id,
                type: 'earned',
                amount: event.coinsReward,
                source: 'event_completion',
                referenceId: event._id
              });
            }

            // Create Activity record only if not already done
            const activityExists = await Activity.findOne({ userId: user._id, eventId: event._id });
            if (!activityExists) {
              await Activity.create({
                userId: user._id,
                eventId: event._id,
                activityType: event.activityType,
                description: `Participated in event: ${event.title}`,
                status: 'approved',
                coinsAwarded: event.coinsReward,
                reviewedAt: new Date()
              });
            }
          }
        }
      } else if (start <= now && now <= end) {
        if (event.status === 'upcoming') {
          event.status = 'ongoing';
          await event.save();
        }
      }
    }
  } catch (error) {
    console.error('Error in autoCompleteEvents:', error.message);
  }
};

// @desc Get all events (with location filter)
const getEvents = async (req, res) => {
  try {
    await autoCompleteEvents(); // Process any expired events before fetching

    const { lat, lng, radius = 10000, type, createdBy, sort = 'newest' } = req.query;
    let query = { status: { $nin: ['cancelled', 'rejected'] } };

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      };
    }

    if (type) query.activityType = type;
    if (createdBy) query.createdBy = createdBy;
    query.isApproved = true;

    let sortObj = {};
    switch (sort) {
      case 'newest':
        sortObj = { isPinned: -1, createdAt: -1 };
        break;
      case 'soonest':
        sortObj = { isPinned: -1, date: 1 };
        break;
      case 'popular':
        // Sort by participants array length requires aggregation in pure mongo,
        // fallback to newest if popular is requested but unsupported without count field
        sortObj = { isPinned: -1, createdAt: -1 }; 
        break;
      case 'reward':
        sortObj = { isPinned: -1, coinsReward: -1 };
        break;
      default:
        sortObj = { isPinned: -1, createdAt: -1 };
    }

    const events = await Event.find(query)
      .sort(sortObj)
      .populate('createdBy', 'name profilePhoto')
      .populate('joinRequests.user', 'name profilePhoto');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create event
const createEvent = async (req, res) => {
  try {
    const { 
      title, description, activityType, eventType, location, address, 
      date, startDate, endDate, coinsReward, duration = 1,
      eventImage, volunteersNeeded, joinPolicy, certificateAvailable,
      latitude, longitude
    } = req.body;

    const activityTypeMap = {
      volunteer: 'volunteering',
      medical_camp: 'blood_donation',
      environment: 'tree_plantation',
      donation_drive: 'other',
      disaster_relief: 'other',
      education: 'other'
    };

    const finalActivityType = activityType || activityTypeMap[eventType] || 'other';

    // Logic to determine final dates
    const finalStartDate = startDate ? new Date(startDate) : new Date(date);
    let finalEndDate;
    
    if (endDate) {
      finalEndDate = new Date(endDate);
    } else {
      // Fallback to duration if endDate not provided
      finalEndDate = new Date(finalStartDate.getTime() + duration * 60 * 60 * 1000);
    }

    let finalLocation = location;
    if (latitude && longitude) {
      finalLocation = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    // Adapt event settings based on whether the creator is a verified NGO
    const ngo = await NGO.findOne({ userId: req.user._id });
    let finalCoinsReward = coinsReward;
    let finalCertificateAvailable = certificateAvailable;
    let isApproved = false;
    let ngoId = undefined;

    if (ngo) {
      isApproved = true; // Auto-approved for verified NGOs
      ngoId = ngo._id;
    } else {
      finalCoinsReward = coinsReward || 500; // Reward for community events upon completion
      finalCertificateAvailable = false; // Certificates disabled for community events
    }

    const event = await Event.create({
      title, description, 
      activityType: finalActivityType, 
      location: finalLocation,
      address, 
      date: finalStartDate, // fallback for legacy
      startDate: finalStartDate,
      endDate: finalEndDate,
      coinsReward: finalCoinsReward, 
      duration, 
      endTime: finalEndDate, // legacy sync
      createdBy: req.user._id,
      ngoId,
      isApproved,
      status: isApproved ? 'upcoming' : 'pending_approval',
      eventImage,
      volunteersNeeded,
      joinPolicy,
      certificateAvailable: finalCertificateAvailable
    });

    // --- Social & Notification Logic ---
    try {
      const ngo = await NGO.findOne({ userId: req.user._id });
      if (ngo) {
        // 1. Create Auto-Announcement Post
        const post = await NGOPost.create({
          ngoId: ngo._id,
          type: 'event_announcement',
          content: `🌱 New Event: ${title}! Join us on ${finalStartDate.toLocaleDateString()} at ${address || 'specified location'}.`,
          imageUrl: eventImage,
          eventId: event._id
        });

        // 2. Notify Followers (where preference is not 'muted')
        const followers = await NGOFollow.find({ 
          ngoId: ngo._id, 
          notificationPreference: { $ne: 'muted' } 
        });

        const notifications = followers.map(f => ({
          userId: f.userId,
          ngoId: ngo._id,
          type: 'new_event',
          referenceId: event._id,
          message: `🌱 ${ngo.name} created a new event: ${title}`
        }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    } catch (socialError) {
      console.error('Social/Notification trigger failed:', socialError.message);
      // We don't fail the event creation if social logic fails
    }

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get single event
const getEventById = async (req, res) => {
  try {
    await autoCompleteEvents();
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name profilePhoto')
      .populate('participants', 'name profilePhoto')
      .populate('comments.user', 'name profilePhoto');

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

    const now = new Date();
    const start = event.startDate || event.date;
    const durationMs = (event.duration || 1) * 60 * 60 * 1000;
    const end = event.endDate || event.endTime || new Date(start.getTime() + durationMs);

    // Only prevent joining if the event has physically ended
    if (end < now) {
      if (event.status !== 'completed') {
        event.status = 'completed';
        await event.save();
      }
      return res.status(400).json({ message: 'Cannot join a completed event' });
    }

    if (event.joinPolicy === 'approval') {
      const alreadyRequested = event.joinRequests?.some(r => r.user?.toString() === req.user._id.toString() || r.user === req.user._id.toString());
      if (alreadyRequested) {
        return res.status(400).json({ message: 'Join request already sent' });
      }
      
      event.joinRequests.push({ user: req.user._id, status: 'pending' });
      await event.save();
      return res.json({ message: 'Join request sent for approval' });
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

// @desc Approve or reject a join request
const handleJoinRequest = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const event = await Event.findById(req.params.id);
    
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if the current user is the creator of the event
    if (event.createdBy?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const requestIndex = event.joinRequests.findIndex(r => r.user?.toString() === req.params.userId || r.user === req.params.userId);
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    if (status === 'approved') {
      event.participants.push(req.params.userId);
    }
    
    // Remove from joinRequests whether approved or rejected
    event.joinRequests.splice(requestIndex, 1);
    
    await event.save();
    res.json({ message: `Request ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get nearby events with filters and sorting
const getNearbyEvents = async (req, res) => {
  try {
    await autoCompleteEvents();

    const { latitude, longitude, radius = 10, category, status, sortBy } = req.query;
    let query = {};

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
      // Map frontend category names to DB activityType
      let dbType = category;
      if (category === 'Blood Donation') dbType = 'blood_donation';
      else if (category === 'Tree Plant') dbType = 'tree_plantation';
      else if (category === 'Volunteering') dbType = 'volunteering';
      query.activityType = dbType;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    query.isApproved = true;

    let queryBuilder = Event.find(query)
      .populate('createdBy', 'name profilePhoto')
      .populate('joinRequests.user', 'name profilePhoto');

    if (sortBy === 'recent') {
      queryBuilder = queryBuilder.sort({ createdAt: -1 });
    } else if (sortBy === 'popular') {
      queryBuilder = queryBuilder.sort({ participants: -1 });
    }

    const events = await queryBuilder;
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc Cancel an event
const cancelEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event)
      return res.status(404).json({ message: 'Event not found.' });

    // Only creator can cancel
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Only the event creator or admin can cancel.' });

    // Cannot cancel completed, cancelled or rejected events
    if (['completed', 'cancelled', 'rejected'].includes(event.status))
      return res.status(400).json({ message: `Cannot cancel an event with status: ${event.status}` });

    const { cancellationReason, cancellationMessage } = req.body;

    if (!cancellationReason)
      return res.status(400).json({ message: 'Cancellation reason is required.' });

    if (cancellationReason === 'Other' && (!cancellationMessage || cancellationMessage.length < 20))
      return res.status(400).json({ message: 'Please provide a detailed reason (min 20 characters).' });

    // Update event status
    event.status = 'cancelled';
    event.cancelledAt = new Date();
    event.cancellationReason = cancellationReason;
    event.cancellationMessage = cancellationMessage || '';
    event.cancelledBy = req.user._id;
    await event.save();

    // Get all applied + joined users
    const allAffectedUsers = [
      ...event.participants,
      ...event.joinRequests
        .filter(r => ['pending', 'approved'].includes(r.status))
        .map(r => r.user)
    ];

    // Remove duplicates and nulls
    const uniqueUsers = [...new Set(allAffectedUsers.map(id => id?.toString()).filter(Boolean))];

    // Create notification for each user
    const notifications = uniqueUsers.map(userId => ({
      userId,
      type: 'event_cancelled',
      eventId: event._id,
      referenceId: event._id, // fallback for schema consistency if needed
      message: `🚫 "${event.title}" has been cancelled.`,
      subMessage: `Reason: ${cancellationReason}${cancellationMessage ? ` — ${cancellationMessage}` : ''}`,
      isRead: false,
      createdAt: new Date(),
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return res.status(200).json({
      message: 'Event cancelled successfully. All volunteers have been notified.',
      cancelledAt: event.cancelledAt,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get events created by user
const getCreatedEvents = async (req, res) => {
  try {
    await autoCompleteEvents(); // Process any expired events
    const { sort = 'newest' } = req.query;
    let sortObj = { createdAt: -1 };
    
    if (sort === 'soonest') sortObj = { date: 1 };
    else if (sort === 'popular') sortObj = { participants: -1 };
    else if (sort === 'reward') sortObj = { coinsReward: -1 };

    const events = await Event.find({ createdBy: req.user._id })
      .sort(sortObj)
      .populate('createdBy', 'name profilePhoto')
      .populate('joinRequests.user', 'name profilePhoto');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get events user joined
const getJoinedEvents = async (req, res) => {
  try {
    await autoCompleteEvents(); // Process any expired events
    const { sort = 'soonest' } = req.query;
    let sortObj = { date: 1 };
    
    if (sort === 'newest') sortObj = { createdAt: -1 };
    else if (sort === 'popular') sortObj = { participants: -1 };
    else if (sort === 'reward') sortObj = { coinsReward: -1 };

    const events = await Event.find({ participants: req.user._id })
      .sort(sortObj)
      .populate('createdBy', 'name profilePhoto')
      .populate('joinRequests.user', 'name profilePhoto');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getEvents, 
  createEvent, 
  getEventById, 
  updateEvent, 
  deleteEvent, 
  joinEvent, 
  leaveEvent, 
  addComment, 
  getComments, 
  handleJoinRequest, 
  getNearbyEvents,
  cancelEvent,
  getCreatedEvents,
  getJoinedEvents
};