const mediaService = require('../services/mediaService');
const { createError } = require('../utils/errorUtils');

/**
 * Get all image types
 */
const getImageTypes = async (req, res, next) => {
  try {
    const types = await mediaService.getImageTypes();
    res.status(200).json({ types });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Upload an image
 */
const uploadImage = async (req, res, next) => {
  try {
    // Get the uploaded file from multer middleware
    const file = req.file;
    
    if (!file) {
      return next(createError('No image file uploaded', 400));
    }
    
    const { 
      imageTypeId, 
      consumerRatingId, 
      consumerReviewId, 
      eduDormId, 
      orderByNumber 
    } = req.body;
    
    // Validate that at least one association is provided
    if (!consumerRatingId && !consumerReviewId && !eduDormId && !req.user.userId) {
      return next(createError('Image must be associated with at least one entity', 400));
    }
    
    // Upload image to storage and save URL in database
    const image = await mediaService.uploadImage({
      imageTypeId,
      consumerRatingId: consumerRatingId || null,
      consumerReviewId: consumerReviewId || null,
      eduDormId: eduDormId || null,
      userId: req.user.userId,
      imageURL: file.path, // This will be replaced by the actual URL after upload
      orderByNumber: orderByNumber || 0,
      isActive: true
    });
    
    res.status(201).json({ message: 'Image uploaded successfully', image });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Delete an image
 */
const deleteImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to delete this image
    const image = await mediaService.getImageById(id);
    
    if (!image) {
      return next(createError('Image not found', 404));
    }
    
    // Check if user owns this image or is an admin
    const isOwner = image.userId === req.user.userId;
    const isAdmin = req.user.roles.includes('Admin');
    
    if (!isOwner && !isAdmin) {
      return next(createError('Not authorized to delete this image', 403));
    }
    
    // Delete the image
    await mediaService.deleteImage(id);
    
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get images by user
 */
const getImagesByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Check if user is requesting their own images or is an admin
    const isOwn = userId === req.user.userId;
    const isAdmin = req.user.roles.includes('Admin');
    
    if (!isOwn && !isAdmin) {
      return next(createError('Not authorized to view these images', 403));
    }
    
    const images = await mediaService.getImagesByUser(userId);
    
    res.status(200).json({ images });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get images by rating
 */
const getImagesByRating = async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    
    const images = await mediaService.getImagesByRating(ratingId);
    
    res.status(200).json({ images });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get images by review
 */
const getImagesByReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    
    const images = await mediaService.getImagesByReview(reviewId);
    
    res.status(200).json({ images });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get images by dorm
 */
const getImagesByDorm = async (req, res, next) => {
  try {
    const { dormId } = req.params;
    
    const images = await mediaService.getImagesByDorm(dormId);
    
    res.status(200).json({ images });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get all images (admin only)
 */
const getAllImages = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, imageTypeId } = req.query;
    
    const images = await mediaService.getAllImages({
      page: parseInt(page),
      limit: parseInt(limit),
      imageTypeId
    });
    
    res.status(200).json(images);
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Moderate an image (admin/moderator only)
 */
const moderateImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, moderationNotes } = req.body;
    
    const updatedImage = await mediaService.moderateImage(id, {
      isActive,
      moderationNotes
    });
    
    res.status(200).json({ 
      message: 'Image moderated successfully', 
      image: updatedImage 
    });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

module.exports = {
  getImageTypes,
  uploadImage,
  deleteImage,
  getImagesByUser,
  getImagesByRating,
  getImagesByReview,
  getImagesByDorm,
  getAllImages,
  moderateImage
};