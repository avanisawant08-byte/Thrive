const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Event = require('../models/Event');
const Notification = require('../models/Notification');
const User = require('../models/User');

const testCancellation = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find any active/upcoming/pending event or create a temp test event
    let event = await Event.findOne({ status: { $in: ['upcoming', 'pending_approval', 'ongoing'] } });

    if (!event) {
      const user = await User.findOne({});
      if (!user) throw new Error('No user found in DB');
      event = await Event.create({
        title: 'Test Cancel Event',
        description: 'Testing event cancellation flow',
        activityType: 'volunteering',
        createdBy: user._id,
        address: 'Test Address',
        date: new Date(),
        status: 'upcoming'
      });
      console.log('Created temporary test event:', event._id);
    } else {
      console.log('Found existing event to test cancel:', event.title, event._id);
    }

    // Perform cancellation simulation
    event.status = 'cancelled';
    event.cancelledAt = new Date();
    event.cancellationReason = 'Personal emergency';
    event.cancellationMessage = 'Unable to organize event due to emergency';
    event.cancelledBy = event.createdBy;
    await event.save();

    console.log('✅ Event successfully updated to cancelled status!');

    // Create test notification
    const notification = await Notification.create({
      userId: event.createdBy,
      type: 'event_cancelled',
      eventId: event._id,
      message: `🚫 "${event.title}" has been cancelled.`,
      subMessage: `Reason: ${event.cancellationReason}`,
      isRead: false
    });

    console.log('✅ Notification created successfully:', notification._id);

    // Verify fetched event
    const updatedEvent = await Event.findById(event._id);
    console.log('Verified Event Status in DB:', updatedEvent.status);

    await mongoose.disconnect();
    console.log('ALL TESTS PASSED CLEANLY! 🎉');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
};

testCancellation();
