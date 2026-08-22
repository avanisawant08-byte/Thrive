const NGO = require('../models/NGO');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Event = require('../models/Event');

// @desc Submit NGO registration
// @route POST /api/ngo/register
const registerNGO = async (req, res) => {
  try {
    const { name, registrationNumber, contactPerson, email, phone, description, logo } = req.body;

    const ngoExists = await NGO.findOne({ email });
    if (ngoExists) return res.status(400).json({ message: 'NGO with this email already registered' });

    const ngo = await NGO.create({
      name,
      registrationNumber,
      contactPerson,
      email,
      phone,
      description,
      logo,
      userId: req.user._id
    });

    res.status(201).json({
      message: 'NGO registration submitted successfully! Waiting for admin approval.',
      ngo
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get NGO profile
// @route GET /api/v1/ngo/profile
const getNGOProfile = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Not authorized, no user data' });
    }
    
    // Use .lean() for performance since it's read-only
    const ngo = await NGO.findOne({ userId: req.user._id }).lean();
    
    if (!ngo) {
      return res.status(404).json({ message: 'NGO profile not found' });
    }
    
    res.json(ngo);
  } catch (error) {
    console.error("NGO Profile Fetch Error:", error);
    res.status(500).json({ message: "Internal Server Error during profile retrieval" });
  }
};

// @desc Get public NGO profile by ID or UserID
// @route GET /api/v1/ngo/:id/public
const getPublicNGOProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try finding by NGO _id first
    let ngo = await NGO.findById(id).select('name logo description registrationNumber isVerified followerCount userId');
    
    // If not found, try finding by userId
    if (!ngo) {
      ngo = await NGO.findOne({ userId: id }).select('name logo description registrationNumber isVerified followerCount userId');
    }
    
    if (!ngo) {
      return res.status(404).json({ message: 'NGO not found' });
    }
    
    res.json(ngo);
  } catch (error) {
    // If id is not a valid ObjectId, findOne might throw or findById might throw CastError
    try {
      const ngoByUserId = await NGO.findOne({ userId: req.params.id }).select('name logo description registrationNumber isVerified followerCount userId');
      if (ngoByUserId) return res.json(ngoByUserId);
    } catch (e) {
      // Ignore inner error
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc Update NGO profile
// @route PUT /api/ngo/profile
const updateNGOProfile = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ userId: req.user._id });
    if (!ngo) return res.status(404).json({ message: 'NGO profile not found' });

    const fieldsToUpdate = ['name', 'contactPerson', 'phone', 'description', 'logo'];
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) ngo[field] = req.body[field];
    });

    const updatedNGO = await ngo.save();
    res.json({ message: 'NGO profile updated', ngo: updatedNGO });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get volunteer profile for NGO review
// @route GET /api/ngo/volunteers/:userId/profile
const getVolunteerProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const ngoUserId = req.user._id;

    // 1. Get User Personal Details
    const volunteer = await User.findById(userId).select('-passwordHash');
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' });

    // 2. Activity Stats
    const totalActivities = await Activity.find({ userId });
    const totalSubmitted = totalActivities.length;
    const totalApproved = totalActivities.filter(a => a.status === 'approved').length;
    const totalRejected = totalActivities.filter(a => a.status === 'rejected').length;
    const approvalRate = totalSubmitted > 0 ? Math.round((totalApproved / totalSubmitted) * 100) : 0;
    const totalCoinsEarned = totalActivities.reduce((sum, a) => sum + (a.coinsAwarded || 0), 0);

    // Leaderboard Rank calculation
    const countHigher = await User.countDocuments({ role: 'user', coinBalance: { $gt: volunteer.coinBalance } });
    const leaderboardRank = countHigher + 1;

    const activityStats = {
      totalSubmitted,
      totalApproved,
      totalRejected,
      approvalRate,
      totalCoinsEarned,
      leaderboardRank,
      currentCoinBalance: volunteer.coinBalance
    };

    // 3. Event History (populated with Event details)
    const eventHistoryRaw = await Activity.find({ userId })
      .populate('eventId', 'title activityType startDate endDate createdBy')
      .sort({ createdAt: -1 });

    const eventHistory = eventHistoryRaw.map(activity => ({
      eventId: activity.eventId?._id,
      eventTitle: activity.eventId?.title || activity.description,
      activityType: activity.activityType,
      eventDate: activity.eventId?.startDate || activity.createdAt,
      organizerName: 'System', // Placeholder, ideally populate eventId.createdBy
      participationStatus: activity.status === 'approved' ? 'completed' : (activity.status === 'rejected' ? 'dropped' : 'pending'),
      proofSubmitted: activity.proofMedia && activity.proofMedia.length > 0,
      verificationStatus: activity.status,
      coinsAwarded: activity.coinsAwarded
    }));

    // 4. Proof Gallery (only approved)
    const proofGallery = totalActivities
      .filter(a => a.status === 'approved' && a.proofMedia && a.proofMedia.length > 0)
      .flatMap(a => a.proofMedia.map(mediaUrl => ({
        mediaUrl,
        eventTitle: a.eventId?.title || a.description,
        approvedAt: a.reviewedAt || a.updatedAt
      })));

    // 5. History with THIS NGO
    // Need to find which events in eventHistory were created by this NGO's user ID
    const historyWithThisNGO = eventHistoryRaw
      .filter(a => a.eventId?.createdBy?.toString() === ngoUserId.toString())
      .map(a => ({
        eventId: a.eventId?._id,
        eventTitle: a.eventId?.title,
        joinedAt: a.createdAt,
        status: a.status === 'approved' ? 'completed' : a.status
      }));

    res.json({
      personalDetails: {
        _id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        profilePhoto: volunteer.profilePhoto,
        bio: volunteer.bio,
        city: volunteer.city,
        location: volunteer.city, // The PRD asks for city/region text
        memberSince: volunteer.createdAt,
        role: volunteer.role
      },
      activityStats,
      eventHistory,
      proofGallery,
      historyWithThisNGO
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get analytics for NGO
// @route GET /api/ngo/analytics
const getNGOAnalytics = async (req, res) => {
  try {
    const ngoUserId = req.user._id;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 1. Monthly Events Growth
    const eventsMonthly = await Event.aggregate([
      { $match: { createdBy: ngoUserId, createdAt: { $gte: sixMonthsAgo } } },
      { 
        $group: { 
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 } 
        } 
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // 2. Monthly Volunteers & Impact (from Activities tied to NGO's events)
    // First find all events by this NGO
    const ngoEvents = await Event.find({ createdBy: ngoUserId }).select('_id');
    const eventIds = ngoEvents.map(e => e._id);

    const activitiesMonthly = await Activity.aggregate([
      { $match: { eventId: { $in: eventIds }, createdAt: { $gte: sixMonthsAgo } } },
      { 
        $group: { 
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          volunteers: { $sum: 1 },
          coins: { $sum: "$coinsAwarded" }
        } 
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // 3. Activity Type Distribution
    const typeDistribution = await Activity.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: "$activityType", count: { $sum: 1 } } }
    ]);

    // 4. Formatting data for Recharts (merge monthly stats)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const statsMap = new Map();

    // Initialize last 6 months
    for (let i = 0; i <= 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getMonth() + 1}-${d.getFullYear()}`;
      statsMap.set(key, { 
        name: months[d.getMonth()], 
        month: d.getMonth() + 1, 
        year: d.getFullYear(), 
        events: 0, 
        volunteers: 0, 
        impact: 0 
      });
    }

    eventsMonthly.forEach(s => {
      const key = `${s._id.month}-${s._id.year}`;
      if (statsMap.has(key)) statsMap.get(key).events = s.count;
    });

    activitiesMonthly.forEach(s => {
      const key = `${s._id.month}-${s._id.year}`;
      if (statsMap.has(key)) {
        statsMap.get(key).volunteers = s.volunteers;
        statsMap.get(key).impact = s.coins;
      }
    });

    const monthlyStats = Array.from(statsMap.values()).reverse();

    res.json({
      monthlyStats,
      typeDistribution: typeDistribution.map(t => ({ name: t._id, value: t.count })),
      summary: {
        totalEvents: ngoEvents.length,
        totalVolunteers: activitiesMonthly.reduce((acc, s) => acc + s.volunteers, 0),
        totalCoinsDistributed: activitiesMonthly.reduce((acc, s) => acc + s.coins, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create a new NGO event
// @route POST /v1/ngo/events
const createNGOEvent = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ userId: req.user._id });
    if (!ngo) return res.status(404).json({ message: 'NGO profile not found' });

    const {
      title, description, date, duration, location: address,
      coinsReward, certificateAvailable, volunteersNeeded, joinPolicy,
      eventType, donationTypesAccepted, targetGoal,
      dropOffLocation, dropOffHours, currentNeeds, skillsRequired, minAge,
      latitude, longitude
    } = req.body;

    // Map eventType to existing activityType enum or use 'other'
    const activityTypeMap = {
      volunteer: 'volunteering', medical_camp: 'blood_donation',
      environment: 'tree_plantation', donation_drive: 'other',
      disaster_relief: 'other', education: 'other'
    };

    let location = undefined;
    if (latitude && longitude) {
      location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    const event = await Event.create({
      title,
      description,
      activityType: activityTypeMap[eventType] || 'other',
      createdBy: req.user._id,
      ngoId: ngo._id,
      address,
      date: new Date(date),
      duration: Number(duration) || 1,
      coinsReward: Number(coinsReward) || 50,
      certificateAvailable: !!certificateAvailable,
      volunteersNeeded: Number(volunteersNeeded) || 0,
      joinPolicy: joinPolicy || 'open',
      status: 'upcoming',
      isApproved: true,
      location
    });

    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all events created by this NGO
// @route GET /v1/ngo/events
const getNGOEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id })
      .populate('participants', 'name email profilePhoto coinBalance')
      .sort({ date: 1 })
      .lean();

    // attach joined count and totalActivities for participants
    const enriched = await Promise.all(events.map(async (ev) => {
      const populatedParticipants = await Promise.all((ev.participants || []).map(async (p) => {
        const activityCount = await Activity.countDocuments({ userId: p._id, status: 'approved' });
        return {
          ...p,
          totalActivities: activityCount
        };
      }));

      return {
        ...ev,
        participants: populatedParticipants,
        eventType: ev.activityType === 'volunteering' ? 'volunteer' :
                   ev.activityType === 'tree_plantation' ? 'environment' :
                   ev.activityType === 'blood_donation' ? 'medical_camp' : 'volunteer',
        joinedCount: ev.participants?.length || 0
      };
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update an event
// @route PUT /v1/ngo/events/:id
const updateNGOEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status !== 'upcoming') return res.status(400).json({ message: 'Can only edit upcoming events' });

    const allowed = ['title', 'description', 'date', 'duration', 'address', 'coinsReward', 'certificateAvailable', 'volunteersNeeded', 'joinPolicy'];
    allowed.forEach(field => { if (req.body[field] !== undefined) event[field] = req.body[field]; });
    await event.save();
    res.json({ message: 'Event updated', event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Cancel an event
// @route DELETE /v1/ngo/events/:id
const deleteNGOEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.status = 'completed'; // soft delete — mark cancelled
    await event.save();
    res.json({ message: 'Event cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get join requests for an event
// @route GET /v1/ngo/events/:id/requests
const getEventJoinRequests = async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, createdBy: req.user._id })
      .populate('joinRequests.user', 'name profilePhoto coinBalance');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    const requests = await Promise.all(event.joinRequests.map(async (r) => {
      if (!r.user) return { _id: r._id, status: r.status, appliedAt: r.requestedAt };
      const activityCount = await Activity.countDocuments({ userId: r.user._id, status: 'approved' });
      return {
        _id: r._id,
        userId: {
          _id: r.user._id,
          name: r.user.name,
          profilePhoto: r.user.profilePhoto,
          coinBalance: r.user.coinBalance,
          totalActivities: activityCount
        },
        status: r.status,
        appliedAt: r.requestedAt,
      };
    }));
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Approve or reject a join request
// @route PUT /v1/ngo/events/:id/requests/:userId
const handleJoinRequest = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }
    const event = await Event.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const request = event.joinRequests.find(r => r.user?.toString() === req.params.userId);
    if (!request) return res.status(404).json({ message: 'Join request not found' });

    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.reviewedAt = new Date();

    if (action === 'approve') {
      if (!event.participants.includes(req.params.userId)) {
        event.participants.push(req.params.userId);
      }
    } else {
      event.participants = event.participants.filter(p => p.toString() !== req.params.userId);
    }

    await event.save();

    res.json({ message: `Request ${request.status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc NGO Dashboard stats
// @route GET /v1/ngo/dashboard
const getNGODashboard = async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({ createdBy: req.user._id });
    
    let activeVolunteers = 0;
    let totalEvents = events.length;
    let totalCoinsDistributed = 0;

    for (const event of events) {
      const start = event.startDate || event.date;
      const durationMs = (event.duration || 1) * 60 * 60 * 1000;
      const end = event.endDate || event.endTime || new Date(start.getTime() + durationMs);

      // Sync event status dynamically based on current time
      let currentStatus = event.status;
      if (end < now) {
        if (event.status !== 'completed') {
          event.status = 'completed';
          await event.save();
          currentStatus = 'completed';
        }
      } else if (start <= now && now <= end) {
        if (event.status === 'upcoming') {
          event.status = 'ongoing';
          await event.save();
          currentStatus = 'ongoing';
        }
      }

      // If event is active, count approved/enrolled participants
      if (currentStatus === 'ongoing') {
        activeVolunteers += (event.participants?.length || 0);
      }

      // Calculate actual coins distributed to participants on completed events
      if (currentStatus === 'completed') {
        totalCoinsDistributed += (event.coinsReward || 0) * (event.participants?.length || 0);
      }
    }

    const ngo = await NGO.findOne({ userId: req.user._id });
    res.json({
      totalEvents,
      activeVolunteers,
      totalCoinsDistributed,
      impactScore: ngo?.impactScore || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all verified NGOs for donation
// @route GET /api/v1/ngo
const getAllNGOs = async (req, res) => {
  try {
    const ngos = await NGO.find({ isVerified: true }).select('name logo description registrationNumber isVerified followerCount userId');
    res.json(ngos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerNGO,
  getNGOProfile,
  getPublicNGOProfile,
  getAllNGOs,
  updateNGOProfile,
  getVolunteerProfile,
  getNGOAnalytics,
  createNGOEvent,
  getNGOEvents,
  updateNGOEvent,
  deleteNGOEvent,
  getEventJoinRequests,
  handleJoinRequest,
  getNGODashboard
};
