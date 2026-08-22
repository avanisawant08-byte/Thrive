const admin = require("firebase-admin");
const path = require("path");

// Load service account JSON file directly
const serviceAccount = require(path.join(__dirname, "../serviceAccountKey.json"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'social-app-3cc98.appspot.com',
  });
}

const auth = admin.auth();
let bucket;
try {
  bucket = admin.storage().bucket();
} catch (_) {
  bucket = null;
}

module.exports = { admin, auth, bucket };