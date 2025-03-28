const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(), // Cloud Run default credentials
  projectId: 'reactgladgrade', // From your logs
});

module.exports = admin;