const admin = require("firebase-admin");
const path = require("path");

const fs = require("fs");

let serviceAccount = null;
const keyPath = path.join(__dirname, "../serviceAccountKey.json");

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:", err.message);
  }
} else if (fs.existsSync(keyPath)) {
  serviceAccount = require(keyPath);
}

if (serviceAccount && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'social-app-3cc98.appspot.com',
    });
    console.log("✅ Firebase Admin initialized with service account.");
  } catch (err) {
    console.error("❌ Failed to initialize Firebase Admin with service account:", err.message);
  }
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'social-app-3cc98',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'social-app-3cc98.appspot.com',
    });
    console.warn("⚠️ Firebase Admin initialized without explicit credentials (limited features).");
  } catch (err) {
    console.warn("⚠️ Firebase Admin initialization failed:", err.message);
  }
}

let auth = null;
try {
  if (admin.apps.length) {
    auth = admin.auth();
  }
} catch (err) {
  console.warn("⚠️ Firebase auth() unavailable:", err.message);
}

let bucket = null;
try {
  if (admin.apps.length) {
    bucket = admin.storage().bucket();
  }
} catch (_) {
  bucket = null;
}

module.exports = { admin, auth, bucket };