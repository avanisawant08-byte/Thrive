const { admin } = require('../config/firebase');

const testFirebase = async () => {
  try {
    console.log('Testing Firebase Admin Auth SDK...');
    const testEmail = 'test@example.com';
    const link = await admin.auth().generatePasswordResetLink(testEmail);
    console.log('✅ Generated Password Reset Link:', link);
  } catch (err) {
    console.error('❌ Firebase Error:', err.message);
    if (err.code) console.error('Error Code:', err.code);
  }
};

testFirebase();
