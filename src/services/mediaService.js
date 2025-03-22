const db = require('../config/db');
const { createError } = require('../utils/errorUtils');

/**
 * Get all image types
 * @returns {Promise<Array>} Image types
 */
const getImageTypes = async () => {
  try {
    const types = await db.query(
      `SELECT * FROM image_types
       ORDER BY image_type`
    );
    
    return types;
  } catch (error) {
    throw createError(`Error getting image types: ${error.message}`, 500, error);
  }
};

/**
 * Get image by ID
 * @param {string|number} id - Image ID
 * @returns {Promise<Object|null>} Image object or null if not found
 */
const getImageById = async (id) => {
  try {
    const result = await db.query(
      `SELECT i.*, it.image_type
       FROM image_urls i
       JOIN image_types it ON i.image_type_id = it.id
       WHERE i.id = $1`,
      { id: parseInt(id) }
    );
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    throw createError(`Error getting image: ${error.message}`, 500, error);
  }
};

/**
 * Upload a new image
 * @param {Object} imageData - Image data
 * @returns {Promise<Object>} Created image record
 */
const uploadImage = async (imageData) => {
  try {
    const {
      imageTypeId,
      consumerRatingId,
      consumerReviewId,
      eduDormId,
      userId,
      imageURL,
      orderByNumber,
      isActive
    } = imageData;
    
    const now = new Date().toISOString();
    
    const result = await db.query(
      `INSERT INTO image_urls (
        image_type_id, consumer_rating_id, consumer_review_id,
        edu_dorm_id, user_id, image_url, order_by_number,
        is_active, date_created
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      {
        imageTypeId: parseInt(imageTypeId),
        consumerRatingId: consumerRatingId ? parseInt(consumerRatingId) : null,
        consumerReviewId: consumerReviewId ? parseInt(consumerReviewId) : null,
        eduDormId: eduDormId ? parseInt(eduDormId) : null,
        userId: parseInt(userId),
        imageURL,
        orderByNumber: orderByNumber || 0,
        isActive: isActive !== undefined ? isActive : true,
        dateCreated: now
      }
    );
    
    const imageId = result[0].id;
    
    return await getImageById(imageId);
  } catch (error) {
    throw createError(`Error uploading image: ${error.message}`, 500, error);
  }
};

/**
 * Delete an image
 * @param {string|number} id - Image ID
 * @returns {Promise<boolean>} Success status
 */
const deleteImage = async (id) => {
  try {
    // Soft delete by setting isActive to false
    await db.query(
      `UPDATE image_urls
       SET is_active = FALSE
       WHERE id = $1`,
      { id: parseInt(id) }
    );
    
    return true;
  } catch (error) {
    throw createError(`Error deleting image: ${error.message}`, 500, error);
  }
};

/**
 * Get images by user
 * @param {string|number} userId - User ID
 * @returns {Promise<Array>} Images
 */
const getImagesByUser = async (userId) => {
  try {
    const images = await db.query(
      `SELECT i.*, it.image_type
       FROM image_urls i
       JOIN image_types it ON i.image_type_id = it.id
       WHERE i.user_id = $1 AND i.is_active = TRUE
       ORDER BY i.date_created DESC`,
      { userId: parseInt(userId) }
    );
    
    return images;
  } catch (error) {
    throw createError(`Error getting images by user: ${error.message}`, 500, error);
  }
};

/**
 * Get images by rating
 * @param {string|number} ratingId - Rating ID
 * @returns {Promise<Array>} Images
 */
const getImagesByRating = async (ratingId) => {
  try {
    const images = await db.query(
      `SELECT i.*, it.image_type
       FROM image_urls i
       JOIN image_types it ON i.image_type_id = it.id
       WHERE i.consumer_rating_id = $1 AND i.is_active = TRUE
       ORDER BY i.order_by_number`,
      { ratingId: parseInt(ratingId) }
    );
    
    return images;
  } catch (error) {
    throw createError(`Error getting images by rating: ${error.message}`, 500, error);
  }
};

/**
 * Get images by review
 * @param {string|number} reviewId - Review ID
 * @returns {Promise<Array>} Images
 */
const getImagesByReview = async (reviewId) => {
  try {
    const images = await db.query(
      `SELECT i.*, it.image_type
       FROM image_urls i
       JOIN image_types it ON i.image_type_id = it.id
       WHERE i.consumer_review_id = $1 AND i.is_active = TRUE
       ORDER BY i.order_by_number`,
      { reviewId: parseInt(reviewId) }
    );
    
    return images;
  } catch (error) {
    throw createError(`Error getting images by review: ${error.message}`, 500, error);
  }
};

/**
 * Get images by dorm
 * @param {string|number} dormId - Dorm ID
 * @returns {Promise<Array>} Images
 */
const getImagesByDorm = async (dormId) => {
  try {
    const images = await db.query(
      `SELECT i.*, it.image_type
       FROM image_urls i
       JOIN image_types it ON i.image_type_id = it.id
       WHERE i.edu_dorm_id = $1 AND i.is_active = TRUE
       ORDER BY i.order_by_number`,
      { dormId: parseInt(dormId) }
    );
    
    return images;
  } catch (error) {
    throw createError(`Error getting images by dorm: ${error.message}`, 500, error);
  }
};

/**
 * Get all images with pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated images
 */
const getAllImages = async (options) => {
  try {
    const { page = 1, limit = 10, imageTypeId } = options;
    const offset = (page - 1) * limit;
    
    // Build query conditions
    const conditions = ['i.is_active = TRUE'];
    const queryParams = { limit, offset };
    
    if (imageTypeId) {
      conditions.push('i.image_type_id = $imageTypeId');
      queryParams.imageTypeId = parseInt(imageTypeId);
    }
    
    // Get images
    const images = await db.query(
      `SELECT i.*, it.image_type
       FROM image_urls i
       JOIN image_types it ON i.image_type_id = it.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY i.date_created DESC
       LIMIT $limit OFFSET $offset`,
      queryParams
    );
    
    // Count total images
    const countResult = await db.query(
      `SELECT COUNT(*) FROM image_urls i
       WHERE ${conditions.join(' AND ')}`,
      queryParams
    );
    
    const totalCount = parseInt(countResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      data: images,
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
    throw createError(`Error getting all images: ${error.message}`, 500, error);
  }
};

/**
 * Moderate an image
 * @param {string|number} id - Image ID
 * @param {Object} moderationData - Moderation data
 * @returns {Promise<Object>} Updated image
 */
const moderateImage = async (id, moderationData) => {
  try {
    const { isActive, moderationNotes } = moderationData;
    
    await db.query(
      `UPDATE image_urls
       SET is_active = $1,
           moderation_notes = $2
       WHERE id = $3`,
      {
        isActive,
        moderationNotes: moderationNotes || null,
        id: parseInt(id)
      }
    );
    
    return await getImageById(id);
  } catch (error) {
    throw createError(`Error moderating image: ${error.message}`, 500, error);
  }
};

module.exports = {
  getImageTypes,
  getImageById,
  uploadImage,
  deleteImage,
  getImagesByUser,
  getImagesByRating,
  getImagesByReview,
  getImagesByDorm,
  getAllImages,
  moderateImage
};