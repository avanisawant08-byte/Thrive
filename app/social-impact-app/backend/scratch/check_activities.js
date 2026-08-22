const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models to register schemas
const User = require('../models/User');
const Event = require('../models/Event');
const Activity = require('../models/Activity');

async function checkActivities() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const activities = await Activity.find().populate('userId', 'name email').populate('eventId', 'title');
    console.log('\n--- All Activities in DB ---');
    activities.forEach((act, idx) => {
      console.log(`${idx + 1}. Description: "${act.description}"`);
      console.log(`   Type: ${act.activityType}`);
      console.log(`   User: ${act.userId?.name || 'Unknown'} (${act.userId?.email || 'N/A'})`);
      console.log(`   Status: ${act.status}`);
      console.log(`   Location: ${JSON.stringify(act.location)}`);
      console.log(`   Created At: ${act.createdAt}`);
      console.log('----------------------------');
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error checking activities:', err);
    process.exit(1);
  }
}

checkActivities();
