const admin = require("firebase-admin");
const path = require("path");

// Load service account JSON file directly
const serviceAccount = require(path.join(__dirname, "../serviceAccountKey.json"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const auth = admin.auth();
const bucket = admin.storage().bucket();

module.exports = { admin, auth, bucket };