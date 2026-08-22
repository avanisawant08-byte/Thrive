const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');

const uri = "mongodb+srv://pr:REDACTED_PASSWORD@cluster0.v4afw4e.mongodb.net/socialimpact?appName=Cluster0";

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
