const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Event = require('../models/Event');
const Activity = require('../models/Activity');
const User = require('../models/User');

async function seedPune() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let user = await User.findOne({ email: 'user@test.com' });
    if (!user) {
      console.log('User not found. Exiting.');
      process.exit(1);
    }

    // Coordinates for Pune (from user screenshot)
    const puneLocation = {
      type: 'Point',
      coordinates: [73.7624015, 18.650916] // [longitude, latitude]
    };

    // Create Test Event in Pune
    const testEvent = new Event({
      title: 'Pune Local Cleanup Drive',
      description: 'A local volunteering event right in your neighborhood!',
      activityType: 'volunteering',
      createdBy: user._id,
      date: new Date(Date.now() + 86400000 * 2), // 2 days from now
      location: puneLocation,
      address: 'Akurdi, Pune, Maharashtra',
      status: 'upcoming'
    });
    await testEvent.save();
    console.log('✅ Created Test Event in Pune');

    // Create Test Activity in Pune
    const testActivity = new Activity({
      userId: user._id,
      activityType: 'tree_plantation',
      title: 'Planted 5 Trees locally',
      description: 'Planted some trees near the society.',
      location: puneLocation,
      address: 'Akurdi, Pune, Maharashtra',
      status: 'approved',
      pointsEarned: 50
    });
    await testActivity.save();
    console.log('✅ Created Test Activity in Pune');

    await mongoose.disconnect();
    console.log('✅ Done');
  } catch (err) {
    console.error(err);
  }
}

seedPune();
