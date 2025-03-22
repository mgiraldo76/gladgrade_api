const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/login-with-phone', authController.loginWithPhone);
router.post('/verify-phone', authController.verifyPhone);
router.post('/guest-login', authController.guestLogin);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.post('/logout', verifyToken, authController.logout);
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;