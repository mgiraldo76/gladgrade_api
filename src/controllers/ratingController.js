const ratingService = require('../services/ratingService');
const { createError } = require('../utils/errorUtils');

/**
 * Get ratings by place ID
 */
const getRatingsByPlace = async (req, res, next) => {
  try {
    const { placeId } = req.params;
    
    const ratings = await ratingService.getRatingsByPlace(placeId);
    
    res.status(200).json({ ratings });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get reviews by place ID
 */
const getReviewsByPlace = async (req, res, next) => {
  try {
    const { placeId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const reviews = await ratingService.getReviewsByPlace(
      placeId, 
      parseInt(page), 
      parseInt(limit)
    );
    
    res.status(200).json(reviews);
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Create a new rating
 */
const createRating = async (req, res, next) => {
  try {
    const { 
      businessTypeId, 
      eduLocationId, 
      placeAddress, 
      placeId, 
      placeName, 
      ratingValue, 
      subcategory 
    } = req.body;
    
    const rating = await ratingService.createRating({
      businessTypeId,
      eduLocationId,
      placeAddress,
      placeId,
      placeName,
      ratingValue,
      subcategory,
      userId: req.user.userId
    });
    
    // Add Glad points for the rating
    await ratingService.addGladPoints(rating.id, req.user.userId);
    
    res.status(201).json({ message: 'Rating created successfully', rating });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Update a rating
 */
const updateRating = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ratingValue } = req.body;
    
    // Check if user owns this rating
    const rating = await ratingService.getRatingById(id);
    
    if (!rating) {
      return next(createError('Rating not found', 404));
    }
    
    if (rating.userId !== req.user.userId && !req.user.roles.includes('Admin')) {
      return next(createError('Not authorized to update this rating', 403));
    }
    
    const updatedRating = await ratingService.updateRating(id, {
      ratingValue
    });
    
    res.status(200).json({ message: 'Rating updated successfully', rating: updatedRating });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Delete a rating
 */
const deleteRating = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user owns this rating
    const rating = await ratingService.getRatingById(id);
    
    if (!rating) {
      return next(createError('Rating not found', 404));
    }
    
    if (rating.userId !== req.user.userId && !req.user.roles.includes('Admin')) {
      return next(createError('Not authorized to delete this rating', 403));
    }
    
    await ratingService.deleteRating(id);
    
    res.status(200).json({ message: 'Rating deleted successfully' });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Create a new review
 */
const createReview = async (req, res, next) => {
  try {
    const { 
      consumerRatingId, 
      review, 
      placeId, 
      isPrivate 
    } = req.body;
    
    // Check if user owns the rating
    const rating = await ratingService.getRatingById(consumerRatingId);
    
    if (!rating) {
      return next(createError('Rating not found', 404));
    }
    
    if (rating.userId !== req.user.userId) {
      return next(createError('Not authorized to create a review for this rating', 403));
    }
    
    const newReview = await ratingService.createReview({
      consumerRatingId,
      review,
      placeId,
      isPrivate: isPrivate || false,
      isActive: true,
      userId: req.user.userId
    });
    
    res.status(201).json({ message: 'Review created successfully', review: newReview });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Update a review
 */
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { review, isPrivate } = req.body;
    
    // Check if user owns this review
    const existingReview = await ratingService.getReviewById(id);
    
    if (!existingReview) {
      return next(createError('Review not found', 404));
    }
    
    if (existingReview.userId !== req.user.userId && !req.user.roles.includes('Admin')) {
      return next(createError('Not authorized to update this review', 403));
    }
    
    const updatedReview = await ratingService.updateReview(id, {
      review,
      isPrivate
    });
    
    res.status(200).json({ message: 'Review updated successfully', review: updatedReview });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Delete a review
 */
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user owns this review
    const review = await ratingService.getReviewById(id);
    
    if (!review) {
      return next(createError('Review not found', 404));
    }
    
    if (review.userId !== req.user.userId && !req.user.roles.includes('Admin')) {
      return next(createError('Not authorized to delete this review', 403));
    }
    
    await ratingService.deleteReview(id);
    
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Submit survey answers
 */
const submitSurveyAnswers = async (req, res, next) => {
  try {
    const { consumerRatingId, answers } = req.body;
    
    // Check if user owns the rating
    const rating = await ratingService.getRatingById(consumerRatingId);
    
    if (!rating) {
      return next(createError('Rating not found', 404));
    }
    
    if (rating.userId !== req.user.userId) {
      return next(createError('Not authorized to submit answers for this rating', 403));
    }
    
    // Process each answer
    const savedAnswers = await Promise.all(
      answers.map(answer => 
        ratingService.createSurveyAnswer({
          surveyQuestionId: answer.surveyQuestionId,
          surveyQuestionsAnswerId: answer.surveyQuestionsAnswerId,
          answer: answer.answer,
          consumerRatingId,
          userId: req.user.userId
        })
      )
    );
    
    res.status(201).json({ 
      message: 'Survey answers submitted successfully', 
      answers: savedAnswers 
    });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Get survey questions by business type ID
 */
const getSurveyQuestionsByType = async (req, res, next) => {
  try {
    const { typeId } = req.params;
    
    const questions = await ratingService.getSurveyQuestionsByType(typeId);
    
    res.status(200).json({ questions });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get all ratings (admin only)
 */
const getAllRatings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, placeId, userId, businessTypeId } = req.query;
    
    const ratings = await ratingService.getAllRatings({
      page: parseInt(page),
      limit: parseInt(limit),
      placeId,
      userId,
      businessTypeId
    });
    
    res.status(200).json(ratings);
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get all reviews (admin only)
 */
const getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, placeId, userId } = req.query;
    
    const reviews = await ratingService.getAllReviews({
      page: parseInt(page),
      limit: parseInt(limit),
      placeId,
      userId
    });
    
    res.status(200).json(reviews);
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Moderate a review (admin/moderator only)
 */
const moderateReview = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isActive, moderationNotes } = req.body;
      
      const updatedReview = await ratingService.moderateReview(id, {
        isActive,
        moderationNotes
      });
      
      res.status(200).json({ 
        message: 'Review moderated successfully', 
        review: updatedReview 
      });
    } catch (error) {
      next(createError(error.message, 400, error));
    }
  };
  
  module.exports = {
    getRatingsByPlace,
    getReviewsByPlace,
    createRating,
    updateRating,
    deleteRating,
    createReview,
    updateReview,
    deleteReview,
    submitSurveyAnswers,
    getSurveyQuestionsByType,
    getAllRatings,
    getAllReviews,
    moderateReview
  };