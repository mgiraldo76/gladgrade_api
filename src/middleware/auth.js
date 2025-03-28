const admin = require('../config/firebase'); // Assuming firebase.js exports initialized admin
const db = require('../config/db'); // Assuming db.js exports a pg Pool

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Set uid, e.g., tOgYSFVUBJbweONbfRcqvabvBCU2
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { verifyToken };