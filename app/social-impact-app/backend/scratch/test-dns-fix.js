const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

console.log("Attempting to connect with Google DNS...");
mongoose.connect(uri, { family: 4 })
  .then(() => {
    console.log("✅ Successfully connected to MongoDB!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Failed to connect:", err.message);
    process.exit(1);
  });
