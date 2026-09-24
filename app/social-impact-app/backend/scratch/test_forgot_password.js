const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const { forgotPassword } = require('../controllers/authController');

const testForgotPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({});
    if (!user) throw new Error('No user found');

    const req = { body: { email: user.email } };
    const res = {
      json: (data) => console.log('✅ Success response:', data),
      status: (code) => ({
        json: (data) => console.log(`Response code ${code}:`, data)
      })
    };

    console.log('Testing forgotPassword for email:', user.email);
    await forgotPassword(req, res);

    await mongoose.disconnect();
    console.log('🎉 Forgot password backend test complete!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
};

testForgotPassword();
