const express = require('express');
const mediaController = require('../controllers/mediaController');
const { checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload'); // We'll create this middleware for file uploads

const router = express.Router();

// Image types
router.get('/image-types', mediaController.getImageTypes);

// Image uploads
router.post('/upload', upload.single('image'), mediaController.uploadImage);
router.delete('/:id', mediaController.deleteImage);

// Get images by association
router.get('/by-user/:userId', mediaController.getImagesByUser);
router.get('/by-rating/:ratingId', mediaController.getImagesByRating);
router.get('/by-review/:reviewId', mediaController.getImagesByReview);
router.get('/by-dorm/:dormId', mediaController.getImagesByDorm);

// Admin routes
router.get('/all', checkRole(['Admin', 'Support']), mediaController.getAllImages);
router.put('/:id/moderate', checkRole(['Admin', 'Moderator']), mediaController.moderateImage);

module.exports = router;