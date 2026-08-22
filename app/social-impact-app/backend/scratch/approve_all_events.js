const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Event = require('../models/Event');

async function approveAllEvents() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log('Connected to DB');
    
    const result = await Event.updateMany({}, { $set: { isApproved: true } });
    console.log(`Updated ${result.modifiedCount} events to isApproved: true.`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

approveAllEvents();
