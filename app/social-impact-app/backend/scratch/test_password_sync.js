const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const { loginUser } = require('../controllers/authController');

const testPasswordSync = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Get a test user
    const user = await User.findOne({ email: 'pranavwakde2530@gmail.com' }) || await User.findOne({});
    if (!user) throw new Error('No user found in database');

    console.log('Testing password sync for email:', user.email);

    // 2. Simulate login attempt with new password and valid idToken
    const newPassword = 'NewSecretPassword123!';
    const req = {
      body: {
        email: user.email,
        password: newPassword,
        idToken: 'mock_firebase_id_token'
      }
    };

    let responseData = null;
    const res = {
      json: (data) => {
        responseData = data;
        console.log('✅ Login Response:', data);
      },
      status: (code) => ({
        json: (data) => console.log(`Response code ${code}:`, data)
      })
    };

    await loginUser(req, res);

    // 3. Verify MongoDB has updated the password hash
    const updatedUser = await User.findOne({ email: user.email });
    const isNewPasswordMatch = await updatedUser.matchPassword(newPassword);

    if (isNewPasswordMatch) {
      console.log('🎉 SUCCESS: MongoDB password hash successfully updated and synced to the new password!');
    } else {
      console.error('❌ FAIL: MongoDB password hash was not updated');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
};

testPasswordSync();
