const db = require('../config/db');
const { createError } = require('../utils/errorUtils');

/**
 * Get ratings by place ID
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object>} Ratings summary
 */
const getRatingsByPlace = async (placeId) => {
  try {
    // Get all ratings for this place
    const ratings = await db.query(
      `SELECT * FROM consumer_ratings
       WHERE place_id = $1`,
      { placeId }
    );
    
    if (ratings.length === 0) {
      return {
        placeId,
        averageRating: 0,
        totalRatings: 0,
        ratingCounts: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        },
        ratings: []
      };
    }
    
    // Calculate average rating
    const sum = ratings.reduce((acc, curr) => acc + curr.rating_value, 0);
    const averageRating = sum / ratings.length;
    
    // Count ratings by value
    const ratingCounts = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };
    
    ratings.forEach(rating => {
      if (rating.rating_value >= 1 && rating.rating_value <= 5) {
        ratingCounts[rating.rating_value]++;
      }
    });
    
    return {
      placeId,
      averageRating,
      totalRatings: ratings.length,
      ratingCounts,
      ratings
    };
  } catch (error) {
    throw createError(`Error getting ratings by place: ${error.message}`, 500, error);
  }
};

/**
 * Get reviews by place ID with pagination
 * @param {string} placeId - Google Place ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated reviews
 */
const getReviewsByPlace = async (placeId, page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    
    // Get reviews
    const reviews = await db.query(
      `SELECT r.*, u.first_name, u.last_name, u.display_name, u.photo_url,
              cr.rating_value, cr.place_name
       FROM consumer_reviews r
       JOIN users u ON r.user_id = u.id
       JOIN consumer_ratings cr ON r.consumer_rating_id = cr.id
       WHERE r.place_id = $1 AND r.is_active = TRUE AND r.is_private = FALSE
       ORDER BY r.date_created DESC
       LIMIT $2 OFFSET $3`,
      { 
        placeId,
        limit,
        offset
      }
    );
    
    // Count total reviews
    const countResult = await db.query(
      `SELECT COUNT(*) FROM consumer_reviews 
       WHERE place_id = $1 AND is_active = TRUE AND is_private = FALSE`,
      { placeId }
    );
    
    const totalCount = parseInt(countResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get review images
    const reviewIds = reviews.map(review => review.id);
    
    const images = reviewIds.length > 0 
      ? await db.query(
          `SELECT * FROM image_urls 
           WHERE consumer_review_id IN ($1) AND is_active = TRUE
           ORDER BY order_by_number`,
          { reviewIds }
        )
      : [];
    
    // Attach images to reviews
    reviews.forEach(review => {
      review.images = images.filter(img => img.consumer_review_id === review.id);
    });
    
    return {
      data: reviews,
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
    throw createError(`Error getting reviews by place: ${error.message}`, 500, error);
  }
};

/**
 * Get a rating by ID
 * @param {string|number} id - Rating ID
 * @returns {Promise<Object|null>} Rating object or null if not found
 */
const getRatingById = async (id) => {
  try {
    const result = await db.query(
      `SELECT * FROM consumer_ratings WHERE id = $1`,
      { id: parseInt(id) }
    );
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    throw createError(`Error getting rating: ${error.message}`, 500, error);
  }
};

/**
 * Create a new rating
 * @param {Object} ratingData - Rating data
 * @returns {Promise<Object>} Created rating
 */
const createRating = async (ratingData) => {
  try {
    const {
      businessTypeId,
      eduLocationId,
      placeAddress,
      placeId,
      placeName,
      ratingValue,
      subcategory,
      userId
    } = ratingData;
    
    const now = new Date().toISOString();
    
    const result = await db.query(
      `INSERT INTO consumer_ratings (
        business_type_id, edu_location_id, place_address, place_id,
        place_name, rating_value, subcategory, user_id, date_created
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      {
        businessTypeId: businessTypeId ? parseInt(businessTypeId) : null,
        eduLocationId: eduLocationId ? parseInt(eduLocationId) : null,
        placeAddress,
        placeId,
        placeName,
        ratingValue: parseInt(ratingValue),
        subcategory: subcategory || null,
        userId: parseInt(userId),
        dateCreated: now
      }
    );
    
    const ratingId = result[0].id;
    
    return await getRatingById(ratingId);
  } catch (error) {
    throw createError(`Error creating rating: ${error.message}`, 500, error);
  }
};

/**
 * Update a rating
 * @param {string|number} id - Rating ID
 * @param {Object} ratingData - Rating data to update
 * @returns {Promise<Object>} Updated rating
 */
const updateRating = async (id, ratingData) => {
  try {
    const { ratingValue } = ratingData;
    
    await db.query(
      `UPDATE consumer_ratings
       SET rating_value = $1
       WHERE id = $2`,
      {
        ratingValue: parseInt(ratingValue),
        id: parseInt(id)
      }
    );
    
    return await getRatingById(id);
  } catch (error) {
    throw createError(`Error updating rating: ${error.message}`, 500, error);
  }
};

/**
 * Delete a rating
 * @param {string|number} id - Rating ID
 * @returns {Promise<boolean>} Success status
 */
const deleteRating = async (id) => {
  try {
    // First, check if there are reviews for this rating
    const reviewsResult = await db.query(
      `SELECT id FROM consumer_reviews WHERE consumer_rating_id = $1`,
      { id: parseInt(id) }
    );
    
    const transaction = async (client) => {
      // Delete related reviews
      if (reviewsResult.length > 0) {
        const reviewIds = reviewsResult.map(review => review.id);
        
        // Delete review images
        await client.query(
          `DELETE FROM image_urls WHERE consumer_review_id IN ($1)`,
          { reviewIds }
        );
        
        // Delete reviews
        await client.query(
          `DELETE FROM consumer_reviews WHERE consumer_rating_id = $1`,
          { id: parseInt(id) }
        );
      }
      
      // Delete rating images
      await client.query(
        `DELETE FROM image_urls WHERE consumer_rating_id = $1`,
        { id: parseInt(id) }
      );
      
      // Delete survey answers
      await client.query(
        `DELETE FROM consumer_survey_question_answers WHERE consumer_rating_id = $1`,
        { id: parseInt(id) }
      );
      
      // Delete glad points
      await client.query(
        `DELETE FROM consumer_glad_points WHERE consumer_rating_id = $1`,
        { id: parseInt(id) }
      );
      
      // Delete rating
      await client.query(
        `DELETE FROM consumer_ratings WHERE id = $1`,
        { id: parseInt(id) }
      );
    };
    
    // Execute transaction
    await db.transaction(transaction);
    
    return true;
  } catch (error) {
    throw createError(`Error deleting rating: ${error.message}`, 500, error);
  }
};

/**
 * Get a review by ID
 * @param {string|number} id - Review ID
 * @returns {Promise<Object|null>} Review object or null if not found
 */
const getReviewById = async (id) => {
  try {
    const result = await db.query(
      `SELECT r.*, cr.place_name, cr.rating_value
       FROM consumer_reviews r
       JOIN consumer_ratings cr ON r.consumer_rating_id = cr.id
       WHERE r.id = $1`,
      { id: parseInt(id) }
    );
    
    if (result.length === 0) {
      return null;
    }
    
    // Get review images
    const images = await db.query(
      `SELECT * FROM image_urls 
       WHERE consumer_review_id = $1 AND is_active = TRUE
       ORDER BY order_by_number`,
      { id: parseInt(id) }
    );
    
    const review = result[0];
    review.images = images;
    
    return review;
  } catch (error) {
    throw createError(`Error getting review: ${error.message}`, 500, error);
  }
};

/**
 * Create a new review
 * @param {Object} reviewData - Review data
 * @returns {Promise<Object>} Created review
 */
const createReview = async (reviewData) => {
  try {
    const {
      consumerRatingId,
      review,
      placeId,
      isPrivate,
      isActive,
      userId
    } = reviewData;
    
    const now = new Date().toISOString();
    
    const result = await db.query(
      `INSERT INTO consumer_reviews (
        consumer_rating_id, review, place_id, is_private,
        is_active, user_id, date_created
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      {
        consumerRatingId: parseInt(consumerRatingId),
        review,
        placeId,
        isPrivate: isPrivate || false,
        isActive: isActive !== undefined ? isActive : true,
        userId: parseInt(userId),
        dateCreated: now
      }
    );
    
    const reviewId = result[0].id;
    
    return await getReviewById(reviewId);
  } catch (error) {
    throw createError(`Error creating review: ${error.message}`, 500, error);
  }
};

/**
 * Update a review
 * @param {string|number} id - Review ID
 * @param {Object} reviewData - Review data to update
 * @returns {Promise<Object>} Updated review
 */
const updateReview = async (id, reviewData) => {
  try {
    const { review, isPrivate } = reviewData;
    
    await db.query(
      `UPDATE consumer_reviews
       SET review = $1,
           is_private = $2
       WHERE id = $3`,
      {
        review,
        isPrivate,
        id: parseInt(id)
      }
    );
    
    return await getReviewById(id);
  } catch (error) {
    throw createError(`Error updating review: ${error.message}`, 500, error);
  }
};

/**
 * Delete a review
 * @param {string|number} id - Review ID
 * @returns {Promise<boolean>} Success status
 */
const deleteReview = async (id) => {
  try {
    const transaction = async (client) => {
      // Delete review images
      await client.query(
        `DELETE FROM image_urls WHERE consumer_review_id = $1`,
        { id: parseInt(id) }
      );
      
      // Delete review
      await client.query(
        `DELETE FROM consumer_reviews WHERE id = $1`,
        { id: parseInt(id) }
      );
    };
    
    // Execute transaction
    await db.transaction(transaction);
    
    return true;
  } catch (error) {
    throw createError(`Error deleting review: ${error.message}`, 500, error);
  }
};

/**
 * Moderate a review
 * @param {string|number} id - Review ID
 * @param {Object} moderationData - Moderation data
 * @returns {Promise<Object>} Updated review
 */
const moderateReview = async (id, moderationData) => {
  try {
    const { isActive, moderationNotes } = moderationData;
    
    await db.query(
      `UPDATE consumer_reviews
       SET is_active = $1,
           moderation_notes = $2
       WHERE id = $3`,
      {
        isActive,
        moderationNotes: moderationNotes || null,
        id: parseInt(id)
      }
    );
    
    return await getReviewById(id);
  } catch (error) {
    throw createError(`Error moderating review: ${error.message}`, 500, error);
  }
};

/**
 * Add glad points for a rating
 * @param {string|number} ratingId - Rating ID
 * @param {string|number} userId - User ID
 * @returns {Promise<Object>} Created glad points record
 */
const addGladPoints = async (ratingId, userId) => {
  try {
    // Default points value
    const points = 10;
    
    const result = await db.query(
      `INSERT INTO consumer_glad_points (
        consumer_rating_id, points, user_id, is_redeemed
      ) VALUES ($1, $2, $3, FALSE)
      RETURNING id`,
      {
        consumerRatingId: parseInt(ratingId),
        points,
        userId: parseInt(userId)
      }
    );
    
    const pointsId = result[0].id;
    
    // Get the created record
    const gladPoints = await db.query(
      `SELECT * FROM consumer_glad_points WHERE id = $1`,
      { id: pointsId }
    );
    
    return gladPoints[0];
  } catch (error) {
    // If points already exist, just return
    if (error.code === '23505') { // Unique violation
      return { message: 'Points already awarded for this rating' };
    }
    
    throw createError(`Error adding glad points: ${error.message}`, 500, error);
  }
};

/**
 * Create a survey answer
 * @param {Object} answerData - Answer data
 * @returns {Promise<Object>} Created answer
 */
const createSurveyAnswer = async (answerData) => {
  try {
    const {
      surveyQuestionId,
      surveyQuestionsAnswerId,
      answer,
      consumerRatingId,
      userId
    } = answerData;
    
    const now = new Date().toISOString();
    
    const result = await db.query(
      `INSERT INTO consumer_survey_question_answers (
        survey_question_id, survey_questions_answer_id, answer,
        consumer_rating_id, user_id, date_created
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      {
        surveyQuestionId: parseInt(surveyQuestionId),
        surveyQuestionsAnswerId: surveyQuestionsAnswerId ? parseInt(surveyQuestionsAnswerId) : null,
        answer,
        consumerRatingId: parseInt(consumerRatingId),
        userId: parseInt(userId),
        dateCreated: now
      }
    );
    
    const answerId = result[0].id;
    
    // Get the created record
    const surveyAnswer = await db.query(
      `SELECT * FROM consumer_survey_question_answers WHERE id = $1`,
      { id: answerId }
    );
    
    return surveyAnswer[0];
  } catch (error) {
    throw createError(`Error creating survey answer: ${error.message}`, 500, error);
  }
};

/**
 * Get survey questions by business type
 * @param {string|number} typeId - Business type ID
 * @returns {Promise<Array>} Survey questions with answer options
 */
const getSurveyQuestionsByType = async (typeId) => {
  try {
    // Get questions
    const questions = await db.query(
      `SELECT * FROM survey_questions
       WHERE business_type_id = $1 AND is_active = TRUE`,
      { typeId: parseInt(typeId) }
    );
    
    if (questions.length === 0) {
      return [];
    }
    
    // Get answer options for each question
    const questionIds = questions.map(q => q.id);
    
    const answerOptions = await db.query(
      `SELECT * FROM survey_questions_answer_options
       WHERE survey_question_id IN ($1)
       ORDER BY id`,
      { questionIds }
    );
    
    // Attach answer options to questions
    questions.forEach(question => {
      question.answerOptions = answerOptions.filter(
        option => option.survey_question_id === question.id
      );
    });
    
    return questions;
  } catch (error) {
    throw createError(`Error getting survey questions: ${error.message}`, 500, error);
  }
};

/**
 * Get all ratings with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated ratings
 */
const getAllRatings = async (options) => {
  try {
    const { page = 1, limit = 10, placeId, userId, businessTypeId } = options;
    const offset = (page - 1) * limit;
    
    // Build query conditions
    const conditions = [];
    const queryParams = { limit, offset };
    let paramIndex = 3;
    
    if (placeId) {
      conditions.push(`r.place_id = $${paramIndex++}`);
      queryParams.placeId = placeId;
    }
    
    if (userId) {
      conditions.push(`r.user_id = $${paramIndex++}`);
      queryParams.userId = parseInt(userId);
    }
    
    if (businessTypeId) {
      conditions.push(`r.business_type_id = $${paramIndex++}`);
      queryParams.businessTypeId = parseInt(businessTypeId);
    }
    
    // Build WHERE clause
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    
    // Get ratings
    const query = `
      SELECT r.*, u.first_name, u.last_name, u.display_name,
             bt.business_type
      FROM consumer_ratings r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN business_types bt ON r.business_type_id = bt.id
      ${whereClause}
      ORDER BY r.date_created DESC
      LIMIT $1 OFFSET $2
    `;
    
    const ratings = await db.query(query, { ...queryParams });
    
    // Count total ratings
    const countQuery = `
      SELECT COUNT(*) FROM consumer_ratings r
      ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, { ...queryParams });
    
    const totalCount = parseInt(countResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      data: ratings,
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
    throw createError(`Error getting all ratings: ${error.message}`, 500, error);
  }
};

/**
 * Get all reviews with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated reviews
 */
const getAllReviews = async (options) => {
  try {
    const { page = 1, limit = 10, placeId, userId } = options;
    const offset = (page - 1) * limit;
    
    // Build query conditions
    const conditions = [];
    const queryParams = { limit, offset };
    let paramIndex = 3;
    
    if (placeId) {
      conditions.push(`r.place_id = $${paramIndex++}`);
      queryParams.placeId = placeId;
    }
    
    if (userId) {
      conditions.push(`r.user_id = $${paramIndex++}`);
      queryParams.userId = parseInt(userId);
    }
    
    // Build WHERE clause
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    
    // Get reviews
    const query = `
      SELECT r.*, u.first_name, u.last_name, u.display_name,
             cr.rating_value, cr.place_name
      FROM consumer_reviews r
      JOIN users u ON r.user_id = u.id
      JOIN consumer_ratings cr ON r.consumer_rating_id = cr.id
      ${whereClause}
      ORDER BY r.date_created DESC
      LIMIT $1 OFFSET $2
    `;
    
    const reviews = await db.query(query, { ...queryParams });
    
    // Count total reviews
    const countQuery = `
      SELECT COUNT(*) FROM consumer_reviews r
      ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, { ...queryParams });
    
    const totalCount = parseInt(countResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      data: reviews,
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
    throw createError(`Error getting all reviews: ${error.message}`, 500, error);
  }
};

module.exports = {
  getRatingsByPlace,
  getReviewsByPlace,
  getRatingById,
  createRating,
  updateRating,
  deleteRating,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  moderateReview,
  addGladPoints,
  createSurveyAnswer,
  getSurveyQuestionsByType,
  getAllRatings,
  getAllReviews
};