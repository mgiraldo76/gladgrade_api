const firebase = require('../config/firebase');
const userService = require('../services/userService');
const { createError } = require('../utils/errorUtils');

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, telephone } = req.body;
    
    // Create user in Firebase
    const userRecord = await firebase.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      phoneNumber: telephone ? telephone : undefined,
    });
    
    // Create user in PostgreSQL
    const user = await userService.createUser({
      firebaseUid: userRecord.uid,
      email,
      firstName,
      lastName,
      telephone: telephone || '',
      displayName: `${firstName} ${lastName}`,
      photoUrl: '',
      primaryRoleId: 9, // Default to 'User' role
      isActive: true,
      isGuest: false,
    });
    
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Login with email and password
 */
const login = async (req, res, next) => {
  // Note: Actual authentication happens in Firebase client SDK
  // This endpoint is for special server-side operations after login
  res.status(200).json({ 
    message: 'Login endpoint (handled by Firebase client SDK)',
    tip: 'Handle actual login in the mobile app using Firebase Auth SDK'
  });
};

/**
 * Login with phone number (step 1: send verification code)
 */
const loginWithPhone = async (req, res, next) => {
  res.status(200).json({ 
    message: 'Phone login endpoint (handled by Firebase client SDK)',
    tip: 'Handle phone verification in the mobile app using Firebase Auth SDK'
  });
};

/**
 * Verify phone number with code (step 2)
 */
const verifyPhone = async (req, res, next) => {
  res.status(200).json({ 
    message: 'Phone verification endpoint (handled by Firebase client SDK)',
    tip: 'Handle verification code confirmation in the mobile app using Firebase Auth SDK'
  });
};

/**
 * Login as guest
 */
const guestLogin = async (req, res, next) => {
  try {
    // Note: Actual anonymous auth happens in Firebase client SDK
    // This is for server-side operations after anonymous login
    
    // Check if Firebase UID was provided
    const { firebaseUid } = req.body;
    if (!firebaseUid) {
      return next(createError('Firebase UID is required', 400));
    }
    
    // Create or get guest user in PostgreSQL
    const user = await userService.getOrCreateGuestUser(firebaseUid);
    
    res.status(200).json({ message: 'Guest login successful', user });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res, next) => {
  res.status(200).json({ 
    message: 'Token refresh endpoint (handled by Firebase client SDK)',
    tip: 'Handle token refresh in the mobile app using Firebase Auth SDK'
  });
};

/**
 * Logout user
 */
const logout = async (req, res, next) => {
  // Note: Actual logout happens in Firebase client SDK
  // This is for server-side cleanup after logout
  try {
    // Update last login timestamp in database
    await userService.updateLastLogin(req.user.userId);
    
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get current user
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    
    if (!user) {
      return next(createError('User not found', 404));
    }
    
    res.status(200).json({ user });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

module.exports = {
  register,
  login,
  loginWithPhone,
  verifyPhone,
  guestLogin,
  refreshToken,
  logout,
  getCurrentUser
};