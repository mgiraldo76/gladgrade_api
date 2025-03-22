const db = require('../config/db');
const { createError } = require('../utils/errorUtils');

/**
 * Get a user by ID
 * @param {string|number} id - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
const getUserById = async (id) => {
  try {
    const result = await db.query(
      `SELECT u.*, r.role FROM users u
       LEFT JOIN roles r ON u.primary_role_id = r.id
       WHERE u.id = $1 AND u.is_deleted = FALSE`,
      { id: parseInt(id) }
    );
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    throw createError(`Error getting user by ID: ${error.message}`, 500, error);
  }
};

/**
 * Get a user by Firebase UID
 * @param {string} firebaseUid - Firebase UID
 * @returns {Promise<Object|null>} User object or null if not found
 */
const getUserByFirebaseUid = async (firebaseUid) => {
  try {
    const result = await db.query(
      `SELECT u.*, r.role FROM users u
       LEFT JOIN roles r ON u.primary_role_id = r.id
       WHERE u.firebase_uid = $1 AND u.is_deleted = FALSE`,
      { firebaseUid }
    );
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    throw createError(`Error getting user by Firebase UID: ${error.message}`, 500, error);
  }
};

/**
 * Get a user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null if not found
 */
const getUserByEmail = async (email) => {
  try {
    const result = await db.query(
      `SELECT u.*, r.role FROM users u
       LEFT JOIN roles r ON u.primary_role_id = r.id
       WHERE u.email = $1 AND u.is_deleted = FALSE`,
      { email }
    );
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    throw createError(`Error getting user by email: ${error.message}`, 500, error);
  }
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const createUser = async (userData) => {
  try {
    const {
      firebaseUid,
      email,
      firstName,
      lastName,
      telephone,
      displayName,
      photoUrl,
      primaryRoleId,
      isActive,
      isGuest
    } = userData;
    
    const now = new Date().toISOString();
    
    const result = await db.query(
      `INSERT INTO users (
        firebase_uid, email, first_name, last_name, telephone,
        is_guest, display_name, photo_url, primary_role_id,
        is_active, is_deleted, date_created, last_updated_at, last_login_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, $11, $11, $11
      ) RETURNING id`,
      {
        firebaseUid,
        email,
        firstName,
        lastName,
        telephone,
        isGuest: isGuest || false,
        displayName,
        photoUrl: photoUrl || '',
        primaryRoleId,
        isActive: isActive || true,
        now
      }
    );
    
    const userId = result[0].id;
    
    return await getUserById(userId);
  } catch (error) {
    throw createError(`Error creating user: ${error.message}`, 500, error);
  }
};

/**
 * Get or create a guest user
 * @param {string} firebaseUid - Firebase UID
 * @returns {Promise<Object>} User object
 */
const getOrCreateGuestUser = async (firebaseUid) => {
  try {
    // Check if user exists
    const existingUser = await getUserByFirebaseUid(firebaseUid);
    
    if (existingUser) {
      return existingUser;
    }
    
    // Get guest role ID
    const roleResult = await db.query(
      'SELECT id FROM roles WHERE role = $1',
      { role: 'Guest' }
    );
    
    if (roleResult.length === 0) {
      throw createError('Guest role not found', 500);
    }
    
    const guestRoleId = roleResult[0].id;
    
    // Create new guest user
    const displayName = `Guest_${Date.now()}`;
    
    return await createUser({
      firebaseUid,
      email: '',
      firstName: 'Guest',
      lastName: '',
      telephone: '',
      displayName,
      photoUrl: '',
      primaryRoleId: guestRoleId,
      isActive: true,
      isGuest: true
    });
  } catch (error) {
    throw createError(`Error creating guest user: ${error.message}`, 500, error);
  }
};

/**
 * Update user information
 * @param {string|number} id - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} Updated user
 */
const updateUser = async (id, userData) => {
  try {
    const {
      firstName,
      lastName,
      telephone,
      displayName,
      photoUrl,
      isActive
    } = userData;
    
    // Build update fields
    const updateFields = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (telephone !== undefined) updateFields.telephone = telephone;
    if (displayName !== undefined) updateFields.displayName = displayName;
    if (photoUrl !== undefined) updateFields.photoUrl = photoUrl;
    if (isActive !== undefined) updateFields.isActive = isActive;
    
    // Add last updated timestamp
    updateFields.lastUpdatedAt = new Date().toISOString();
    
    // Build query dynamically
    const setClauses = Object.keys(updateFields).map((key, index) => {
      // Convert camelCase to snake_case for PostgreSQL
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      return `${snakeKey} = $${index + 2}`;
    });
    
    if (setClauses.length === 0) {
      return await getUserById(id);
    }
    
    const query = `
      UPDATE users
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING id
    `;
    
    // Execute update query
    await db.query(
      query,
      { 
        id: parseInt(id), 
        ...Object.values(updateFields)
      }
    );
    
    return await getUserById(id);
  } catch (error) {
    throw createError(`Error updating user: ${error.message}`, 500, error);
  }
};

/**
 * Update user's last login time
 * @param {string|number} id - User ID
 * @returns {Promise<void>}
 */
const updateLastLogin = async (id) => {
  try {
    const now = new Date().toISOString();
    
    await db.query(
      'UPDATE users SET last_login_at = $1 WHERE id = $2',
      { 
        lastLoginAt: now,
        id: parseInt(id)
      }
    );
  } catch (error) {
    throw createError(`Error updating last login: ${error.message}`, 500, error);
  }
};

/**
 * Mark a user as deleted
 * @param {string|number} id - User ID
 * @returns {Promise<boolean>} Success status
 */
const markUserAsDeleted = async (id) => {
  try {
    const now = new Date().toISOString();
    
    // Update user record
    await db.query(
      'UPDATE users SET is_deleted = TRUE, is_active = FALSE, last_updated_at = $1 WHERE id = $2',
      { 
        lastUpdatedAt: now,
        id: parseInt(id)
      }
    );
    
    // Add record to deletedUsers table
    await db.query(
      'INSERT INTO deleted_users (user_id, deleted_datetime) VALUES ($1, $2)',
      { 
        userId: parseInt(id),
        deletedDatetime: now
      }
    );
    
    return true;
  } catch (error) {
    throw createError(`Error marking user as deleted: ${error.message}`, 500, error);
  }
};

/**
 * Change user's primary role
 * @param {string|number} id - User ID
 * @param {number} roleId - New role ID
 * @returns {Promise<Object>} Updated user
 */
const changeUserRole = async (id, roleId) => {
  try {
    await db.query(
      'UPDATE users SET primary_role_id = $1, last_updated_at = $2 WHERE id = $3',
      { 
        primaryRoleId: roleId,
        lastUpdatedAt: new Date().toISOString(),
        id: parseInt(id)
      }
    );
    
    return await getUserById(id);
  } catch (error) {
    throw createError(`Error changing user role: ${error.message}`, 500, error);
  }
};

/**
 * Get all users with pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated users list
 */
const getAllUsers = async (options) => {
  try {
    const { page = 1, limit = 10, search, role } = options;
    const offset = (page - 1) * limit;
    
    // Build query conditions
    const conditions = ['u.is_deleted = FALSE'];
    const queryParams = { limit, offset };
    
    if (search) {
      conditions.push('(u.first_name ILIKE $search OR u.last_name ILIKE $search OR u.email ILIKE $search)');
      queryParams.search = `%${search}%`;
    }
    
    if (role) {
      conditions.push('r.role = $role');
      queryParams.role = role;
    }
    
    // Build the full query
    const query = `
      SELECT u.*, r.role FROM users u
      LEFT JOIN roles r ON u.primary_role_id = r.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.id DESC
      LIMIT $limit OFFSET $offset
    `;
    
    // Count total matching users
    const countQuery = `
      SELECT COUNT(*) FROM users u
      LEFT JOIN roles r ON u.primary_role_id = r.id
      WHERE ${conditions.join(' AND ')}
    `;
    
    const [users, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, queryParams)
    ]);
    
    const totalCount = parseInt(countResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      data: users,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    throw createError(`Error getting all users: ${error.message}`, 500, error);
  }
};

/**
 * Get user's reviews
 * @param {string|number} userId - User ID
 * @returns {Promise<Array>} User's reviews
 */
const getUserReviews = async (userId) => {
  try {
    const reviews = await db.query(
      `SELECT r.*, cr.place_name, cr.place_id, cr.rating_value 
       FROM consumer_reviews r
       JOIN consumer_ratings cr ON r.consumer_rating_id = cr.id
       WHERE r.user_id = $1 AND r.is_active = TRUE
       ORDER BY r.date_created DESC`,
      { userId: parseInt(userId) }
    );
    
    return reviews;
  } catch (error) {
    throw createError(`Error getting user reviews: ${error.message}`, 500, error);
  }
};

/**
 * Get user's ratings
 * @param {string|number} userId - User ID
 * @returns {Promise<Array>} User's ratings
 */
const getUserRatings = async (userId) => {
  try {
    const ratings = await db.query(
      `SELECT r.*, bt.business_type 
       FROM consumer_ratings r
       LEFT JOIN business_types bt ON r.business_type_id = bt.id
       WHERE r.user_id = $1
       ORDER BY r.date_created DESC`,
      { userId: parseInt(userId) }
    );
    
    return ratings;
  } catch (error) {
    throw createError(`Error getting user ratings: ${error.message}`, 500, error);
  }
};

/**
 * Get user's Glad points
 * @param {string|number} userId - User ID
 * @returns {Promise<Object>} Points information
 */
const getUserPoints = async (userId) => {
  try {
    // Get total points
    const totalPointsResult = await db.query(
      `SELECT SUM(points) as total_points
       FROM consumer_glad_points
       WHERE user_id = $1`,
      { userId: parseInt(userId) }
    );
    
    const totalPoints = parseInt(totalPointsResult[0]?.total_points || 0);
    
    // Get redeemed points
    const redeemedPointsResult = await db.query(
      `SELECT SUM(points) as redeemed_points
       FROM consumer_glad_points
       WHERE user_id = $1 AND is_redeemed = TRUE`,
      { userId: parseInt(userId) }
    );
    
    const redeemedPoints = parseInt(redeemedPointsResult[0]?.redeemed_points || 0);
    
    // Get available points
    const availablePoints = totalPoints - redeemedPoints;
    
    // Get points history
    const pointsHistory = await db.query(
      `SELECT cgp.*, cr.place_name, cr.place_id
       FROM consumer_glad_points cgp
       JOIN consumer_ratings cr ON cgp.consumer_rating_id = cr.id
       WHERE cgp.user_id = $1
       ORDER BY cgp.is_redeemed_datetime DESC NULLS FIRST, 
                cgp.date_created DESC`,
      { userId: parseInt(userId) }
    );
    
    return {
      totalPoints,
      redeemedPoints,
      availablePoints,
      pointsHistory
    };
  } catch (error) {
    throw createError(`Error getting user points: ${error.message}`, 500, error);
  }
};

/**
 * Get user's business types
 * @param {string|number} userId - User ID
 * @returns {Promise<Array>} User's business types
 */
const getUserBusinessTypes = async (userId) => {
  try {
    const businessTypes = await db.query(
      `SELECT cbt.*, bt.business_type, bt.business_sector_id, bs.business_sector_name
       FROM consumer_business_types cbt
       JOIN business_types bt ON cbt.business_type_id = bt.id
       JOIN business_sector bs ON bt.business_sector_id = bs.id
       WHERE cbt.user_id = $1
       ORDER BY cbt.sort_number`,
      { userId: parseInt(userId) }
    );
    
    return businessTypes;
  } catch (error) {
    throw createError(`Error getting user business types: ${error.message}`, 500, error);
  }
};

/**
 * Add a business type to user's preferences
 * @param {string|number} userId - User ID
 * @param {number} businessTypeId - Business type ID
 * @param {number} sortNumber - Sort order
 * @returns {Promise<Object>} Created preference
 */
const addUserBusinessType = async (userId, businessTypeId, sortNumber) => {
  try {
    // Check if already exists
    const existing = await db.query(
      `SELECT * FROM consumer_business_types
       WHERE user_id = $1 AND business_type_id = $2`,
      { 
        userId: parseInt(userId),
        businessTypeId: parseInt(businessTypeId)
      }
    );
    
    if (existing.length > 0) {
      throw createError('This business type is already in user preferences', 400);
    }
    
    // If sort number not provided, put at the end
    if (!sortNumber) {
      const maxSortResult = await db.query(
        `SELECT MAX(sort_number) as max_sort
         FROM consumer_business_types
         WHERE user_id = $1`,
        { userId: parseInt(userId) }
      );
      
      sortNumber = (parseInt(maxSortResult[0]?.max_sort || 0) + 1);
    }
    
    // Insert new preference
    const result = await db.query(
      `INSERT INTO consumer_business_types
       (user_id, business_type_id, sort_number, date_created)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      { 
        userId: parseInt(userId),
        businessTypeId: parseInt(businessTypeId),
        sortNumber,
        dateCreated: new Date().toISOString()
      }
    );
    
    const newId = result[0].id;
    
    // Get the full record with related data
    const newPreference = await db.query(
      `SELECT cbt.*, bt.business_type, bt.business_sector_id, bs.business_sector_name
       FROM consumer_business_types cbt
       JOIN business_types bt ON cbt.business_type_id = bt.id
       JOIN business_sector bs ON bt.business_sector_id = bs.id
       WHERE cbt.id = $1`,
      { id: newId }
    );
    
    return newPreference[0];
  } catch (error) {
    throw createError(`Error adding business type to user: ${error.message}`, 500, error);
  }
};

/**
 * Update a user's business type preference
 * @param {string|number} id - Preference ID
 * @param {string|number} userId - User ID
 * @param {number} sortNumber - New sort order
 * @returns {Promise<Object>} Updated preference
 */
const updateUserBusinessType = async (id, userId, sortNumber) => {
  try {
    // Verify ownership
    const existing = await db.query(
      `SELECT * FROM consumer_business_types
       WHERE id = $1`,
      { id: parseInt(id) }
    );
    
    if (existing.length === 0) {
      throw createError('Business type preference not found', 404);
    }
    
    if (existing[0].user_id !== parseInt(userId)) {
      throw createError('Not authorized to update this preference', 403);
    }
    
    // Update sort number
    await db.query(
      `UPDATE consumer_business_types
       SET sort_number = $1
       WHERE id = $2`,
      { 
        sortNumber,
        id: parseInt(id)
      }
    );
    
    // Get updated record with related data
    const updated = await db.query(
      `SELECT cbt.*, bt.business_type, bt.business_sector_id, bs.business_sector_name
       FROM consumer_business_types cbt
       JOIN business_types bt ON cbt.business_type_id = bt.id
       JOIN business_sector bs ON bt.business_sector_id = bs.id
       WHERE cbt.id = $1`,
      { id: parseInt(id) }
    );
    
    return updated[0];
  } catch (error) {
    throw createError(`Error updating business type preference: ${error.message}`, 500, error);
  }
};

/**
 * Delete a business type from user's preferences
 * @param {string|number} id - Preference ID
 * @param {string|number} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
const deleteUserBusinessType = async (id, userId) => {
  try {
    // Verify ownership
    const existing = await db.query(
      `SELECT * FROM consumer_business_types
       WHERE id = $1`,
      { id: parseInt(id) }
    );
    
    if (existing.length === 0) {
      throw createError('Business type preference not found', 404);
    }
    
    if (existing[0].user_id !== parseInt(userId)) {
      throw createError('Not authorized to delete this preference', 403);
    }
    
    // Delete the preference
    await db.query(
      `DELETE FROM consumer_business_types
       WHERE id = $1`,
      { id: parseInt(id) }
    );
    
    return true;
  } catch (error) {
    throw createError(`Error deleting business type preference: ${error.message}`, 500, error);
  }
};

module.exports = {
  getUserById,
  getUserByFirebaseUid,
  getUserByEmail,
  createUser,
  getOrCreateGuestUser,
  updateUser,
  updateLastLogin,
  markUserAsDeleted,
  changeUserRole,
  getAllUsers,
  getUserReviews,
  getUserRatings,
  getUserPoints,
  getUserBusinessTypes,
  addUserBusinessType,
  updateUserBusinessType,
  deleteUserBusinessType
};