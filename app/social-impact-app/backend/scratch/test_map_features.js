const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Event = require('../models/Event');
const Activity = require('../models/Activity');
const User = require('../models/User');

const API_BASE = 'http://localhost:5000/v1';

async function testMapFeatures() {
  let testUserId;
  let testEventId;
  let testActivityId;

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Check 2dsphere indexes
    const eventIndexes = await Event.collection.indexes();
    const hasEventGeoIndex = eventIndexes.some(idx => idx.key.location === '2dsphere');
    console.log(`Event 2dsphere index present: ${hasEventGeoIndex ? '✅' : '❌'}`);

    const activityIndexes = await Activity.collection.indexes();
    const hasActivityGeoIndex = activityIndexes.some(idx => idx.key.location === '2dsphere');
    console.log(`Activity 2dsphere index present: ${hasActivityGeoIndex ? '✅' : '❌'}`);

    if (!hasEventGeoIndex || !hasActivityGeoIndex) {
      console.warn('⚠️ Rebuilding indexes just in case...');
      await Event.syncIndexes();
      await Activity.syncIndexes();
      console.log('✅ Indexes synced');
    }

    // Coordinates for test: New Delhi, Connaught Place
    const testLocation = {
      type: 'Point',
      coordinates: [77.2167, 28.6328] // [longitude, latitude]
    };

    // Create a test user for references
    const user = new User({
      name: 'Map Tester',
      email: 'maptester@example.com',
      passwordHash: 'dummyhash123',
      role: 'user'
    });
    await user.save();
    testUserId = user._id;

    // 2. Create Test Event
    const testEvent = new Event({
      title: '[TEST] Connaught Place Cleanup',
      description: 'A test event for geospatial queries.',
      activityType: 'volunteering',
      createdBy: testUserId,
      date: new Date(),
      location: testLocation,
      address: 'Connaught Place, New Delhi',
      status: 'upcoming'
    });
    await testEvent.save();
    testEventId = testEvent._id;
    console.log('✅ Created Test Event at CP, Delhi');

    // 3. Create Test Activity
    const testActivity = new Activity({
      userId: testUserId,
      activityType: 'volunteering',
      title: '[TEST] Planted a tree',
      description: 'A test activity for geospatial queries.',
      location: testLocation,
      address: 'Connaught Place, New Delhi',
      status: 'approved',
      pointsEarned: 10
    });
    await testActivity.save();
    testActivityId = testActivity._id;
    console.log('✅ Created Test Activity at CP, Delhi');

    // 4. Test Mongoose Geo Query
    console.log('\n--- Testing Database $near Queries ---');
    // Querying from India Gate (approx 2.5km away from CP)
    const queryCoords = [77.2295, 28.6129];
    
    const eventsFound = await Event.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: queryCoords },
          $maxDistance: 5000 // 5km
        }
      }
    });
    console.log(`Events found within 5km of India Gate: ${eventsFound.length} (Expected > 0)`);
    
    const activitiesFound = await Activity.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: queryCoords },
          $maxDistance: 5000 // 5km
        }
      }
    });
    console.log(`Activities found within 5km of India Gate: ${activitiesFound.length} (Expected > 0)`);

    // 5. Test Backend API Endpoints
    console.log('\n--- Testing Backend API Endpoints ---');
    try {
      const eventRes = await fetch(`${API_BASE}/events/nearby?latitude=28.6129&longitude=77.2295&radius=5`);
      const eventData = await eventRes.json();
      console.log(`API /events/nearby: Found ${eventData.length} events. ${eventData.length > 0 ? '✅' : '❌'}`);

      const activityRes = await fetch(`${API_BASE}/activities/nearby?latitude=28.6129&longitude=77.2295&radius=5`);
      const activityData = await activityRes.json();
      console.log(`API /activities/nearby: Found ${activityData.length} activities. ${activityData.length > 0 ? '✅' : '❌'}`);
    } catch (apiErr) {
      console.error('❌ API Test Failed:', apiErr.message);
    }

  } catch (err) {
    console.error('❌ Test script failed:', err);
  } finally {
    console.log('\n--- Cleaning up test data ---');
    if (testUserId) await User.findByIdAndDelete(testUserId);
    if (testEventId) await Event.findByIdAndDelete(testEventId);
    if (testActivityId) await Activity.findByIdAndDelete(testActivityId);
    console.log('✅ Cleanup complete');

    await mongoose.disconnect();
    process.exit(0);
  }
}

testMapFeatures();
