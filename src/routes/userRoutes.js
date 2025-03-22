const express = require('express');
const userController = require('../controllers/userController');
const { checkRole } = require('../middleware/auth');

const router = express.Router();

// User profile management (all authenticated)
router.get('/profile', userController.getCurrentUser);
router.put('/profile', userController.updateProfile);
router.delete('/profile', userController.deleteAccount);

// User's data
router.get('/reviews', userController.getUserReviews);
router.get('/ratings', userController.getUserRatings);
router.get('/points', userController.getUserPoints);

// User preferences
router.get('/business-types', userController.getUserBusinessTypes);
router.post('/business-types', userController.addUserBusinessType);
router.put('/business-types/:id', userController.updateUserBusinessType);
router.delete('/business-types/:id', userController.deleteUserBusinessType);

// Admin-only routes
router.get('/', checkRole(['Admin', 'Support']), userController.getAllUsers);
router.get('/:id', checkRole(['Admin', 'Support']), userController.getUserById);
router.put('/:id', checkRole(['Admin']), userController.updateUser);
router.delete('/:id', checkRole(['Admin']), userController.deleteUser);
router.put('/:id/role', checkRole(['Admin']), userController.changeUserRole);

module.exports = router;