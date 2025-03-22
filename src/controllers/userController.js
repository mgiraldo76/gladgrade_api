const userService = require('../services/userService');
const { createError } = require('../utils/errorUtils');

/**
 * Get current user profile
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

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, telephone, displayName, photoUrl } = req.body;
    
    const updatedUser = await userService.updateUser(req.user.userId, {
      firstName,
      lastName,
      telephone,
      displayName,
      photoUrl
    });
    
    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Delete user account
 */
const deleteAccount = async (req, res, next) => {
  try {
    await userService.markUserAsDeleted(req.user.userId);
    // Note: Firebase user deletion should be handled on the client side
    
    res.status(200).json({ message: 'Account marked for deletion successfully' });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get user's reviews
 */
const getUserReviews = async (req, res, next) => {
  try {
    const reviews = await userService.getUserReviews(req.user.userId);
    res.status(200).json({ reviews });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get user's ratings
 */
const getUserRatings = async (req, res, next) => {
  try {
    const ratings = await userService.getUserRatings(req.user.userId);
    res.status(200).json({ ratings });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get user's Glad points
 */
const getUserPoints = async (req, res, next) => {
  try {
    const points = await userService.getUserPoints(req.user.userId);
    res.status(200).json({ points });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get user's business types
 */
const getUserBusinessTypes = async (req, res, next) => {
  try {
    const businessTypes = await userService.getUserBusinessTypes(req.user.userId);
    res.status(200).json({ businessTypes });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Add a business type to user's preferences
 */
const addUserBusinessType = async (req, res, next) => {
  try {
    const { businessTypeId, sortNumber } = req.body;
    
    const result = await userService.addUserBusinessType(
      req.user.userId, 
      businessTypeId, 
      sortNumber
    );
    
    res.status(201).json({ 
      message: 'Business type added to user preferences', 
      userBusinessType: result 
    });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Update a user's business type preference
 */
const updateUserBusinessType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sortNumber } = req.body;
    
    const result = await userService.updateUserBusinessType(
      id,
      req.user.userId, 
      sortNumber
    );
    
    res.status(200).json({ 
      message: 'Business type preference updated', 
      userBusinessType: result 
    });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Delete a business type from user's preferences
 */
const deleteUserBusinessType = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await userService.deleteUserBusinessType(id, req.user.userId);
    
    res.status(200).json({ message: 'Business type removed from user preferences' });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Get all users (admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    
    const users = await userService.getAllUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      role
    });
    
    res.status(200).json(users);
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get user by ID (admin only)
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await userService.getUserById(id);
    
    if (!user) {
      return next(createError('User not found', 404));
    }
    
    res.status(200).json({ user });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Update user (admin only)
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, telephone, displayName, photoUrl, isActive } = req.body;
    
    const updatedUser = await userService.updateUser(id, {
      firstName,
      lastName,
      telephone,
      displayName,
      photoUrl,
      isActive
    });
    
    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Delete user (admin only)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await userService.markUserAsDeleted(id);
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Change user role (admin only)
 */
const changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;
    
    const updatedUser = await userService.changeUserRole(id, roleId);
    
    res.status(200).json({ message: 'User role updated successfully', user: updatedUser });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

module.exports = {
  getCurrentUser,
  updateProfile,
  deleteAccount,
  getUserReviews,
  getUserRatings,
  getUserPoints,
  getUserBusinessTypes,
  addUserBusinessType,
  updateUserBusinessType,
  deleteUserBusinessType,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changeUserRole
};