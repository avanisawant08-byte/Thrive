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
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'social-app-3cc98.appspot.com',
  });
} else if (!admin.apps.length) {
  console.warn("⚠️ Firebase Admin initialized without credentials (limited features).");
}

const auth = admin.auth();
let bucket;
try {
  bucket = admin.storage().bucket();
} catch (_) {
  bucket = null;
}

module.exports = { admin, auth, bucket };