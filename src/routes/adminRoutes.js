const express = require('express');
const adminController = require('../controllers/adminController');
const { checkRole } = require('../middleware/auth');

const router = express.Router();

// All routes need admin access
router.use(checkRole(['Admin']));

// FAQ management
router.get('/faqs', adminController.getAllFaqs);
router.post('/faqs', adminController.createFaq);
router.put('/faqs/:id', adminController.updateFaq);
router.delete('/faqs/:id', adminController.deleteFaq);

// Site content management
router.get('/site-content', adminController.getAllSiteContent);
router.post('/site-content', adminController.createSiteContent);
router.put('/site-content/:id', adminController.updateSiteContent);
router.delete('/site-content/:id', adminController.deleteSiteContent);

// Survey questions management
router.get('/survey-questions', adminController.getAllSurveyQuestions);
router.post('/survey-questions', adminController.createSurveyQuestion);
router.put('/survey-questions/:id', adminController.updateSurveyQuestion);
router.delete('/survey-questions/:id', adminController.deleteSurveyQuestion);

// Message management
router.get('/messages', adminController.getAllMessages);
router.put('/messages/:id/read', adminController.markMessageAsRead);
router.put('/messages/:id/reply', adminController.replyToMessage);
router.delete('/messages/:id', adminController.deleteMessage);

// Ad management
router.get('/ads', adminController.getAllAds);
router.post('/ads', adminController.createAd);
router.put('/ads/:id', adminController.updateAd);
router.delete('/ads/:id', adminController.deleteAd);

// User activity logs
router.get('/user-logs', adminController.getUserActivityLogs);
router.get('/user-logs/:userId', adminController.getUserActivityLogsByUser);

module.exports = router;