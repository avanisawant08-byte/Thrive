const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const NGO = require('../models/NGO');

async function createTestNGO() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    const email = 'ngo@test.com';
    const password = 'password123';
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      user = await User.create({
        name: 'Test NGO User',
        email,
        passwordHash,
        role: 'ngo',
      });
      console.log('Test NGO user created.');
    }

    let ngo = await NGO.findOne({ email: 'contact@testngo.com' });
    if (!ngo) {
      ngo = await NGO.create({
        name: 'Test NGO Organization',
        registrationNumber: 'NGO-123456',
        contactPerson: 'Jane Doe',
        email: 'contact@testngo.com',
        phone: '1234567890',
        description: 'This is a test NGO for testing purposes.',
        isVerified: true,
        userId: user._id
      });
      console.log('Test NGO profile created.');
    } else {
        console.log('Test NGO already exists.');
    }

    console.log('--- CREDENTIALS ---');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('-------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createTestNGO();
