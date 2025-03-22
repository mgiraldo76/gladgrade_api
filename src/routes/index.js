
const express = require('express');

const authRoutes = require('./authRoutes');
/*const userRoutes = require('./userRoutes');
const businessRoutes = require('./businessRoutes');
const ratingRoutes = require('./ratingRoutes');
const educationRoutes = require('./educationRoutes');
const mediaRoutes = require('./mediaRoutes');
const adminRoutes = require('./adminRoutes');*/

const { verifyToken } = require('../middleware/auth');

const router = express.Router();


// Basic route for testing
router.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});


// Public routes (no authentication required)
router.use('/auth', authRoutes);

// Protected routes (authentication required)
/*router.use('/users', verifyToken, userRoutes);
router.use('/business', verifyToken, businessRoutes);
router.use('/ratings', verifyToken, ratingRoutes);
router.use('/education', verifyToken, educationRoutes);
router.use('/media', verifyToken, mediaRoutes);
router.use('/admin', verifyToken, adminRoutes); */

module.exports = router;


/*

const express = require('express');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const businessRoutes = require('./businessRoutes');
const ratingRoutes = require('./ratingRoutes');
const educationRoutes = require('./educationRoutes');
const mediaRoutes = require('./mediaRoutes');
const adminRoutes = require('./adminRoutes');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Public routes (no authentication required)
router.use('/auth', authRoutes);

// Protected routes (authentication required)
router.use('/users', verifyToken, userRoutes);
router.use('/business', verifyToken, businessRoutes);
router.use('/ratings', verifyToken, ratingRoutes);
router.use('/education', verifyToken, educationRoutes);
router.use('/media', verifyToken, mediaRoutes);
router.use('/admin', verifyToken, adminRoutes);

module.exports = router;

*/