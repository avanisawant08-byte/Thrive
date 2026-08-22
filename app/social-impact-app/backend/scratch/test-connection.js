require("dotenv").config();
const mongoose = require("mongoose");

// ─────────────────────────────────────────────
// Test MongoDB Connection
// ─────────────────────────────────────────────
const testMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully!");
    console.log("   Host:", mongoose.connection.host);
    console.log("   Database:", mongoose.connection.name);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
  }
};

// ─────────────────────────────────────────────
// Test Firebase Connection
// ─────────────────────────────────────────────
const testFirebase = async () => {
  try {
    const { admin } = require("./config/firebase");
    await admin.auth().listUsers(1);
    console.log("✅ Firebase Connected Successfully!");
    console.log("   Project ID:", process.env.FIREBASE_PROJECT_ID);
  } catch (error) {
    console.error("❌ Firebase Connection Failed:", error.message);
  }
};

// ─────────────────────────────────────────────
// Run Both Tests
// ─────────────────────────────────────────────
const runTests = async () => {
  console.log("\n🔍 Testing Connections...\n");
  await testMongoDB();
  await testFirebase();
  console.log("\n✅ Tests Complete!\n");
  process.exit(0);
};

runTests();