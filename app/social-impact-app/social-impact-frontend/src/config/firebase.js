import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAoLILC0n_LL6B-MPOmbssfIVIv3pWxveM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'social-app-3cc98.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'social-app-3cc98',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'social-app-3cc98.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '3542891319',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:3542891319:web:c1392424f2de0469b278b2'
};

// Initialize Firebase safely
let app = null;
let auth = null;
let googleProvider = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (err) {
  console.error('Firebase initialization error:', err);
}

export { auth, googleProvider };
