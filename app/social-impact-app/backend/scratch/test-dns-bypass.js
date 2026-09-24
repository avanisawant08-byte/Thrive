require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(() => {
    console.log("✅ Successfully connected to MongoDB directly!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Failed to connect:", err);
    process.exit(1);
  });
