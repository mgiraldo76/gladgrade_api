const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin with minimal configuration
// In development, this will use the application default credentials
try {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'reactgladgrade'
  });
  console.log('Firebase admin initialized successfully');
} catch (error) {
  // Firebase might already be initialized
  console.log('Firebase initialization error (might be already initialized):', error.message);
}

module.exports = admin;