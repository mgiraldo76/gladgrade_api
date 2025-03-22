const adminService = require('../services/adminService');
const { createError } = require('../utils/errorUtils');

/**
 * Get all FAQs
 */
const getAllFaqs = async (req, res, next) => {
  try {
    const faqs = await adminService.getAllFaqs();
    res.status(200).json({ faqs });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Create a new FAQ
 */
const createFaq = async (req, res, next) => {
  try {
    const { faq, faqAnswer, environmentTypeId, isActive } = req.body;
    
    const newFaq = await adminService.createFaq({
      faq,
      faqAnswer,
      environmentTypeId,
      isActive: isActive || true
    });
    
    res.status(201).json({ message: 'FAQ created successfully', faq: newFaq });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Update an FAQ
 */
const updateFaq = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { faq, faqAnswer, environmentTypeId, isActive } = req.body;
    
    const updatedFaq = await adminService.updateFaq(id, {
      faq,
      faqAnswer,
      environmentTypeId,
      isActive
    });
    
    res.status(200).json({ message: 'FAQ updated successfully', faq: updatedFaq });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Delete an FAQ
 */
const deleteFaq = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await adminService.deleteFaq(id);
    
    res.status(200).json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get all site content
 */
const getAllSiteContent = async (req, res, next) => {
  try {
    const content = await adminService.getAllSiteContent();
    res.status(200).json({ content });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Create new site content
 */
const createSiteContent = async (req, res, next) => {
  try {
    const { 
      subject, 
      content, 
      isActive, 
      messageCategoryIds, 
      environmentTypeIds 
    } = req.body;
    
    const newContent = await adminService.createSiteContent({
      subject,
      content,
      isActive: isActive || true,
      messageCategoryIds,
      environmentTypeIds
    });
    
    res.status(201).json({ message: 'Site content created successfully', content: newContent });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Update site content
 */
const updateSiteContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      subject, 
      content, 
      isActive, 
      messageCategoryIds, 
      environmentTypeIds 
    } = req.body;
    
    const updatedContent = await adminService.updateSiteContent(id, {
      subject,
      content,
      isActive,
      messageCategoryIds,
      environmentTypeIds
    });
    
    res.status(200).json({ message: 'Site content updated successfully', content: updatedContent });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Delete site content
 */
const deleteSiteContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await adminService.deleteSiteContent(id);
    
    res.status(200).json({ message: 'Site content deleted successfully' });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get all survey questions
 */
const getAllSurveyQuestions = async (req, res, next) => {
  try {
    const questions = await adminService.getAllSurveyQuestions();
    res.status(200).json({ questions });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Create a new survey question
 */
const createSurveyQuestion = async (req, res, next) => {
  try {
    const { 
      question, 
      businessTypeId, 
      eduCategoryId, 
      isActive, 
      answerOptions 
    } = req.body;
    
    const newQuestion = await adminService.createSurveyQuestion({
      question,
      businessTypeId,
      eduCategoryId,
      isActive: isActive || true,
      answerOptions
    });
    
    res.status(201).json({ message: 'Survey question created successfully', question: newQuestion });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Update a survey question
 */
const updateSurveyQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      question, 
      businessTypeId, 
      eduCategoryId, 
      isActive, 
      answerOptions 
    } = req.body;
    
    const updatedQuestion = await adminService.updateSurveyQuestion(id, {
      question,
      businessTypeId,
      eduCategoryId,
      isActive,
      answerOptions
    });
    
    res.status(200).json({ 
      message: 'Survey question updated successfully', 
      question: updatedQuestion 
    });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Delete a survey question
 */
const deleteSurveyQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await adminService.deleteSurveyQuestion(id);
    
    res.status(200).json({ message: 'Survey question deleted successfully' });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get all messages
 */
const getAllMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isRead, isReplied, requiresReply, category } = req.query;
    
    const messages = await adminService.getAllMessages({
      page: parseInt(page),
      limit: parseInt(limit),
      isRead: isRead === 'true',
      isReplied: isReplied === 'true',
      requiresReply: requiresReply === 'true',
      category
    });
    
    res.status(200).json(messages);
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Mark message as read
 */
const markMessageAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const updatedMessage = await adminService.markMessageAsRead(id);
    
    res.status(200).json({ 
      message: 'Message marked as read', 
      message: updatedMessage 
    });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Reply to a message
 */
const replyToMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { replyText } = req.body;
    
    const updatedMessage = await adminService.replyToMessage(id, {
      replyText,
      repliedBy: req.user.userId
    });
    
    res.status(200).json({ 
      message: 'Message replied successfully', 
      message: updatedMessage 
    });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Delete a message
 */
const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await adminService.deleteMessage(id);
    
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get all ads
 */
const getAllAds = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    
    const ads = await adminService.getAllAds({
      page: parseInt(page),
      limit: parseInt(limit),
      isActive: isActive === 'true'
    });
    
    res.status(200).json(ads);
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Create a new ad
 */
const createAd = async (req, res, next) => {
  try {
    const { 
      businessName, 
      businessTelephone, 
      content, 
      expirationDate,
      imageURL, 
      url,
      isActive 
    } = req.body;
    
    const newAd = await adminService.createAd({
      businessName,
      businessTelephone,
      content,
      expirationDate,
      imageURL,
      url,
      isActive: isActive || true
    });
    
    res.status(201).json({ message: 'Ad created successfully', ad: newAd });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Update an ad
 */
const updateAd = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      businessName, 
      businessTelephone, 
      content, 
      expirationDate,
      imageURL, 
      url,
      isActive 
    } = req.body;
    
    const updatedAd = await adminService.updateAd(id, {
      businessName,
      businessTelephone,
      content,
      expirationDate,
      imageURL,
      url,
      isActive
    });
    
    res.status(200).json({ message: 'Ad updated successfully', ad: updatedAd });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Delete an ad
 */
const deleteAd = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await adminService.deleteAd(id);
    
    res.status(200).json({ message: 'Ad deleted successfully' });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get user activity logs
 */
const getUserActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, eventType, eventCategory, startDate, endDate } = req.query;
    
    const logs = await adminService.getUserActivityLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      eventType,
      eventCategory,
      startDate,
      endDate
    });
    
    res.status(200).json(logs);
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};


/**
 * Get user activity logs by user
 */
const getUserActivityLogsByUser = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, eventType, eventCategory, startDate, endDate } = req.query;
      
      const logs = await adminService.getUserActivityLogsByUser(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        eventType,
        eventCategory,
        startDate,
        endDate
      });
      
      res.status(200).json(logs);
    } catch (error) {
      next(createError(error.message, 500, error));
    }
  };
  
  module.exports = {
    getAllFaqs,
    createFaq,
    updateFaq,
    deleteFaq,
    getAllSiteContent,
    createSiteContent,
    updateSiteContent,
    deleteSiteContent,
    getAllSurveyQuestions,
    createSurveyQuestion,
    updateSurveyQuestion,
    deleteSurveyQuestion,
    getAllMessages,
    markMessageAsRead,
    replyToMessage,
    deleteMessage,
    getAllAds,
    createAd,
    updateAd,
    deleteAd,
    getUserActivityLogs,
    getUserActivityLogsByUser
  };