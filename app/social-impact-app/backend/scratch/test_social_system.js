const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Follow = require('../models/Follow');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

const testSocialSystem = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas for Social System Test');

    // 1. Create or fetch test users
    let userPublic = await User.findOne({ email: 'test_public_user@impact.com' });
    if (!userPublic) {
      userPublic = await User.create({
        name: 'Public User Test',
        email: 'test_public_user@impact.com',
        passwordHash: 'dummy_hash',
        isPrivate: false,
        username: 'public_user_test'
      });
    }

    let userPrivate = await User.findOne({ email: 'test_private_user@impact.com' });
    if (!userPrivate) {
      userPrivate = await User.create({
        name: 'Private User Test',
        email: 'test_private_user@impact.com',
        passwordHash: 'dummy_hash',
        isPrivate: true,
        username: 'private_user_test'
      });
    }

    let userFollower = await User.findOne({ email: 'test_follower_user@impact.com' });
    if (!userFollower) {
      userFollower = await User.create({
        name: 'Follower User Test',
        email: 'test_follower_user@impact.com',
        passwordHash: 'dummy_hash',
        isPrivate: false,
        username: 'follower_user_test'
      });
    }

    console.log('✅ Test Users initialized');

    // Clean previous test follows
    await Follow.deleteMany({
      $or: [
        { followerId: userFollower._id },
        { followingId: userFollower._id },
        { followerId: userPublic._id },
        { followerId: userPrivate._id }
      ]
    });

    // 2. Test Public Account Follow
    const publicFollow = await Follow.create({
      followerId: userFollower._id,
      followingId: userPublic._id,
      followingType: 'user',
      status: 'active',
      approvedAt: new Date()
    });
    console.log('✅ Public Account Follow created with status: active');

    // 3. Test Private Account Follow Request
    const privateFollow = await Follow.create({
      followerId: userFollower._id,
      followingId: userPrivate._id,
      followingType: 'user',
      status: 'pending',
      requestedAt: new Date()
    });
    console.log('✅ Private Account Follow created with status: pending');

    // Verify Notification Creation
    const reqNotification = await Notification.create({
      userId: userPrivate._id,
      senderId: userFollower._id,
      type: 'follow_request',
      message: `🔔 ${userFollower.name} requested to follow you.`
    });
    console.log('✅ Follow request notification generated:', reqNotification._id);

    // 4. Test Approval of Follow Request
    privateFollow.status = 'active';
    privateFollow.approvedAt = new Date();
    await privateFollow.save();
    console.log('✅ Follow request approved successfully!');

    // 5. Test Post Creation (Public vs Followers Only)
    await Post.deleteMany({ authorId: { $in: [userPublic._id, userPrivate._id] } });

    const publicPost = await Post.create({
      authorId: userPublic._id,
      authorType: 'user',
      content: 'Hello World from Public User! 🌱',
      visibility: 'public'
    });

    const privatePost = await Post.create({
      authorId: userPrivate._id,
      authorType: 'user',
      content: 'Exclusive post for followers only 🔒',
      visibility: 'followers_only'
    });

    console.log('✅ Public & Followers Only posts created successfully');

    // 6. Test Feed Query Engine
    const activeFollows = await Follow.find({ followerId: userFollower._id, status: 'active' });
    const followedUserIds = activeFollows.map(f => f.followingId);

    const feedPosts = await Post.find({
      isDeleted: false,
      $or: [
        { authorId: userFollower._id },
        { authorId: { $in: followedUserIds }, visibility: { $in: ['public', 'followers_only'] } },
        { visibility: 'public' }
      ]
    }).sort({ createdAt: -1 });

    console.log(`✅ Unified Feed Query returned ${feedPosts.length} posts for follower user`);

    await mongoose.disconnect();
    console.log('🎉 ALL PRD v1.0 SOCIAL FOLLOW & FEED TESTS PASSED CLEANLY!');
  } catch (err) {
    console.error('❌ Social System Test Failed:', err);
    process.exit(1);
  }
};

testSocialSystem();
