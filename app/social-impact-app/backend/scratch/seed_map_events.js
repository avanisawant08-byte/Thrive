const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Event = require('../models/Event');
const User = require('../models/User');
const NGO = require('../models/NGO');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find any user with role ngo or admin to be the creator
    let user = await User.findOne({ role: { $in: ['ngo', 'admin'] } });
    if (!user) {
      user = await User.findOne({});
    }

    if (!user) {
      console.log('No user found to assign events to. Please register/create a user first.');
      process.exit(0);
    }

    const ngo = await NGO.findOne({ userId: user._id }) || { _id: null };

    // Coordinates around Delhi center [longitude, latitude]
    const sampleEvents = [
      {
        title: 'Connaught Place Blood Donation Camp',
        description: 'Join our urgent blood donation camp at Connaught Place to save lives.',
        activityType: 'blood_donation',
        createdBy: user._id,
        ngoId: ngo._id,
        address: 'Connaught Place, New Delhi',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        duration: 4,
        coinsReward: 100,
        status: 'upcoming',
        location: {
          type: 'Point',
          coordinates: [77.2197, 28.6304] // [lng, lat]
        }
      },
      {
        title: 'India Gate Green Plantation Drive',
        description: 'Planting 500 saplings around India Gate to improve Delhi air quality.',
        activityType: 'tree_plantation',
        createdBy: user._id,
        ngoId: ngo._id,
        address: 'India Gate Lawns, New Delhi',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        duration: 3,
        coinsReward: 80,
        status: 'upcoming',
        location: {
          type: 'Point',
          coordinates: [77.2295, 28.6129] // [lng, lat]
        }
      },
      {
        title: 'Janpath Volunteering Drive',
        description: 'Helping set up community library and clean public spaces near Janpath.',
        activityType: 'volunteering',
        createdBy: user._id,
        ngoId: ngo._id,
        address: 'Janpath Metro Station area, New Delhi',
        date: new Date(Date.now() - 12 * 60 * 60 * 1000), // ongoing
        duration: 24,
        coinsReward: 150,
        status: 'ongoing',
        location: {
          type: 'Point',
          coordinates: [77.2182, 28.6214] // [lng, lat]
        }
      }
    ];

    // Delete existing sample map events to avoid duplication
    await Event.deleteMany({ title: { $in: sampleEvents.map(e => e.title) } });

    const created = await Event.create(sampleEvents);
    console.log(`Successfully seeded ${created.length} geo-located events around Delhi!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding map events:', err);
    process.exit(1);
  }
}

seed();
