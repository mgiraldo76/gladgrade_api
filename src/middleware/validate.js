const { validationResult, body } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Common validation rules
const userValidationRules = {
  register: [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
  ],
  login: [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  updateProfile: [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('telephone').optional().isMobilePhone().withMessage('Invalid phone number'),
  ],
};

const ratingValidationRules = {
  createRating: [
    body('placeId').notEmpty().withMessage('Place ID is required'),
    body('ratingValue').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('businessTypeId').isInt().withMessage('Business type ID must be an integer'),
  ],
  createReview: [
    body('consumerRatingId').isInt().withMessage('Consumer rating ID must be an integer'),
    body('review').notEmpty().withMessage('Review text is required'),
  ],
};

// Export validation middleware creator
const createValidationMiddleware = (rules) => {
  return [...rules, validate];
};

module.exports = {
  validate,
  userValidationRules,
  ratingValidationRules,
  createValidationMiddleware,
};