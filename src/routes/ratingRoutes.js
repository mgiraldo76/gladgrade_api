const express = require('express');
const ratingController = require('../controllers/ratingController');
const { checkRole } = require('../middleware/auth');

const router = express.Router();

// Public read routes
router.get('/by-place/:placeId', ratingController.getRatingsByPlace);
router.get('/reviews/by-place/:placeId', ratingController.getReviewsByPlace);

// Protected write routes
router.post('/', ratingController.createRating);
router.put('/:id', ratingController.updateRating);
router.delete('/:id', ratingController.deleteRating);

// Reviews
router.post('/reviews', ratingController.createReview);
router.put('/reviews/:id', ratingController.updateReview);
router.delete('/reviews/:id', ratingController.deleteReview);

// Survey question answers
router.post('/survey-answers', ratingController.submitSurveyAnswers);
router.get('/survey-questions/by-type/:typeId', ratingController.getSurveyQuestionsByType);

// Admin routes
router.get('/all', checkRole(['Admin', 'Support']), ratingController.getAllRatings);
router.get('/reviews/all', checkRole(['Admin', 'Support']), ratingController.getAllReviews);
router.put('/reviews/:id/moderate', checkRole(['Admin', 'Moderator']), ratingController.moderateReview);

module.exports = router;