// @ts-nocheck
const db = require('../config/db');
const { createError } = require('../utils/errorUtils');

/**
 * Get all FAQs
 * @returns {Promise<Array>} FAQs
 */
const getAllFaqs = async () => {
  try {
    const faqs = await db.query(
      `SELECT f.*, et.name as environment_type
       FROM faqs f
       JOIN environment_types et ON f.environment_type_id = et.id
       ORDER BY f.date_created DESC`
    );
    
    return faqs;
  } catch (error) {
    throw createError(`Error getting FAQs: ${error.message}`, 500, error);
  }
};

/**
 * Create a new FAQ
 * @param {Object} faqData - FAQ data
 * @returns {Promise<Object>} Created FAQ
 */
const createFaq = async (faqData) => {
  try {
    const { faq, faqAnswer, environmentTypeId, isActive } = faqData;
    
    const now = new Date().toISOString();
    
    const result = await db.query(
      `INSERT INTO faqs (
        faq, faq_answer, environment_type_id, is_active, date_created
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      {
        faq,
        faqAnswer,
        environmentTypeId: parseInt(environmentTypeId),
        isActive: isActive !== undefined ? isActive : true,
        dateCreated: now
      }
    );
    
    const faqId = result[0].id;
    
    // Get the created FAQ
    const createdFaq = await db.query(
      `SELECT f.*, et.name as environment_type
       FROM faqs f
       JOIN environment_types et ON f.environment_type_id = et.id
       WHERE f.id = $1`,
      { id: faqId }
    );
    
    return createdFaq[0];
  } catch (error) {
    throw createError(`Error creating FAQ: ${error.message}`, 500, error);
  }
};

/**
 * Update an FAQ
 * @param {string|number} id - FAQ ID
 * @param {Object} faqData - FAQ data to update
 * @returns {Promise<Object>} Updated FAQ
 */
const updateFaq = async (id, faqData) => {
  try {
    const { faq, faqAnswer, environmentTypeId, isActive } = faqData;
    
    await db.query(
      `UPDATE faqs
       SET faq = $1,
           faq_answer = $2,
           environment_type_id = $3,
           is_active = $4
       WHERE id = $5`,
      {
        faq,
        faqAnswer,
        environmentTypeId: parseInt(environmentTypeId),
        isActive,
        id: parseInt(id)
      }
    );
    
    // Get the updated FAQ
    const updatedFaq = await db.query(
      `SELECT f.*, et.name as environment_type
       FROM faqs f
       JOIN environment_types et ON f.environment_type_id = et.id
       WHERE f.id = $1`,
      { id: parseInt(id) }
    );
    
    if (updatedFaq.length === 0) {
      throw createError('FAQ not found', 404);
    }
    
    return updatedFaq[0];
  } catch (error) {
    throw createError(`Error updating FAQ: ${error.message}`, 500, error);
  }
};

/**
 * Delete an FAQ
 * @param {string|number} id - FAQ ID
 * @returns {Promise<boolean>} Success status
 */
const deleteFaq = async (id) => {
  try {
    await db.query(
      'DELETE FROM faqs WHERE id = $1',
      { id: parseInt(id) }
    );
    
    return true;
  } catch (error) {
    throw createError(`Error deleting FAQ: ${error.message}`, 500, error);
  }
};

/**
 * Get all site content
 * @returns {Promise<Array>} Site content
 */
const getAllSiteContent = async () => {
  try {
    const content = await db.query(
      `SELECT * FROM site_page_documents
       ORDER BY active_since_datetime DESC`
    );
    
    // Get related categories and environment types
    for (const item of content) {
      // Get categories
      const categories = await db.query(
        `SELECT mc.id, mc.name 
         FROM site_page_document_category_rel spdcr
         JOIN message_categories mc ON spdcr.message_category_id = mc.id
         WHERE spdcr.site_page_document_id = $1`,
        { id: item.id }
      );
      
      // Get environment types
      const environmentTypes = await db.query(
        `SELECT et.id, et.name
         FROM site_page_documents_used_in_rel spdur
         JOIN environment_types et ON spdur.environment_type_id = et.id
         WHERE spdur.site_page_document_id = $1`,
        { id: item.id }
      );
      
      item.categories = categories;
      item.environmentTypes = environmentTypes;
    }
    
    return content;
  } catch (error) {
    throw createError(`Error getting site content: ${error.message}`, 500, error);
  }
};

/**
 * Create new site content
 * @param {Object} contentData - Content data
 * @returns {Promise<Object>} Created content
 */
const createSiteContent = async (contentData) => {
  try {
    const {
      subject,
      content,
      isActive,
      messageCategoryIds,
      environmentTypeIds
    } = contentData;
    
    const now = new Date().toISOString();
    
    // Create transaction
    const transaction = async (client) => {
      // Insert site content
      const result = await client.query(
        `INSERT INTO site_page_documents (
          subject, content, is_active, date_created, active_since_datetime
        ) VALUES ($1, $2, $3, $4, $4)
        RETURNING id`,
        {
          subject,
          content,
          isActive: isActive !== undefined ? isActive : true,
          dateCreated: now
        }
      );
      
      const contentId = result[0].id;
      
      // Add category relationships
      if (messageCategoryIds && messageCategoryIds.length > 0) {
        for (const categoryId of messageCategoryIds) {
          await client.query(
            `INSERT INTO site_page_document_category_rel (
              site_page_document_id, message_category_id
            ) VALUES ($1, $2)`,
            {
              sitePageDocumentId: contentId,
              messageCategoryId: parseInt(categoryId)
            }
          );
        }
      }
      
      // Add environment type relationships
      if (environmentTypeIds && environmentTypeIds.length > 0) {
        for (const typeId of environmentTypeIds) {
          await client.query(
            `INSERT INTO site_page_documents_used_in_rel (
              site_page_document_id, environment_type_id
            ) VALUES ($1, $2)`,
            {
              sitePageDocumentId: contentId,
              environmentTypeId: parseInt(typeId)
            }
          );
        }
      }
      
      return contentId;
    };
    
    // Execute transaction
    const contentId = await db.transaction(transaction);
    
    // Get the created content with relationships
    const createdContent = await db.query(
      'SELECT * FROM site_page_documents WHERE id = $1',
      { id: contentId }
    );
    
    if (createdContent.length === 0) {
      throw createError('Content not found after creation', 500);
    }
    
    const item = createdContent[0];
    
    // Get categories
    const categories = await db.query(
      `SELECT mc.id, mc.name 
       FROM site_page_document_category_rel spdcr
       JOIN message_categories mc ON spdcr.message_category_id = mc.id
       WHERE spdcr.site_page_document_id = $1`,
      { id: item.id }
    );
    
    // Get environment types
    const environmentTypes = await db.query(
      `SELECT et.id, et.name
       FROM site_page_documents_used_in_rel spdur
       JOIN environment_types et ON spdur.environment_type_id = et.id
       WHERE spdur.site_page_document_id = $1`,
      { id: item.id }
    );
    
    item.categories = categories;
    item.environmentTypes = environmentTypes;
    
    return item;
  } catch (error) {
    throw createError(`Error creating site content: ${error.message}`, 500, error);
  }
};

/**
 * Update site content
 * @param {string|number} id - Content ID
 * @param {Object} contentData - Content data to update
 * @returns {Promise<Object>} Updated content
 */
const updateSiteContent = async (id, contentData) => {
  try {
    const {
      subject,
      content,
      isActive,
      messageCategoryIds,
      environmentTypeIds
    } = contentData;
    
    // Create transaction
    const transaction = async (client) => {
      // Update site content
      await client.query(
        `UPDATE site_page_documents
         SET subject = $1,
             content = $2,
             is_active = $3
         WHERE id = $4`,
        {
          subject,
          content,
          isActive,
          id: parseInt(id)
        }
      );
      
      // Update category relationships
      if (messageCategoryIds) {
        // Delete existing relationships
        await client.query(
          'DELETE FROM site_page_document_category_rel WHERE site_page_document_id = $1',
          { id: parseInt(id) }
        );
        
        // Add new relationships
        if (messageCategoryIds.length > 0) {
          for (const categoryId of messageCategoryIds) {
            await client.query(
              `INSERT INTO site_page_document_category_rel (
                site_page_document_id, message_category_id
              ) VALUES ($1, $2)`,
              {
                sitePageDocumentId: parseInt(id),
                messageCategoryId: parseInt(categoryId)
              }
            );
          }
        }
      }
      
      // Update environment type relationships
      if (environmentTypeIds) {
        // Delete existing relationships
        await client.query(
          'DELETE FROM site_page_documents_used_in_rel WHERE site_page_document_id = $1',
          { id: parseInt(id) }
        );
        
        // Add new relationships
        if (environmentTypeIds.length > 0) {
          for (const typeId of environmentTypeIds) {
            await client.query(
              `INSERT INTO site_page_documents_used_in_rel (
                site_page_document_id, environment_type_id
              ) VALUES ($1, $2)`,
              {
                sitePageDocumentId: parseInt(id),
                environmentTypeId: parseInt(typeId)
              }
            );
          }
        }
      }
    };
    
    // Execute transaction
    await db.transaction(transaction);
    
    // Get the updated content with relationships
    const updatedContent = await db.query(
      'SELECT * FROM site_page_documents WHERE id = $1',
      { id: parseInt(id) }
    );
    
    if (updatedContent.length === 0) {
      throw createError('Content not found', 404);
    }
    
    const item = updatedContent[0];
    
    // Get categories
    const categories = await db.query(
      `SELECT mc.id, mc.name 
       FROM site_page_document_category_rel spdcr
       JOIN message_categories mc ON spdcr.message_category_id = mc.id
       WHERE spdcr.site_page_document_id = $1`,
      { id: item.id }
    );
    
    // Get environment types
    const environmentTypes = await db.query(
      `SELECT et.id, et.name
       FROM site_page_documents_used_in_rel spdur
       JOIN environment_types et ON spdur.environment_type_id = et.id
       WHERE spdur.site_page_document_id = $1`,
      { id: item.id }
    );
    
    item.categories = categories;
    item.environmentTypes = environmentTypes;
    
    return item;
  } catch (error) {
    throw createError(`Error updating site content: ${error.message}`, 500, error);
  }
};

/**
 * Delete site content
 * @param {string|number} id - Content ID
 * @returns {Promise<boolean>} Success status
 */
const deleteSiteContent = async (id) => {
  try {
    // Create transaction
    const transaction = async (client) => {
      // Delete category relationships
      await client.query(
        'DELETE FROM site_page_document_category_rel WHERE site_page_document_id = $1',
        { id: parseInt(id) }
      );
      
      // Delete environment type relationships
      await client.query(
        'DELETE FROM site_page_documents_used_in_rel WHERE site_page_document_id = $1',
        { id: parseInt(id) }
      );
      
      // Delete site content
      await client.query(
        'DELETE FROM site_page_documents WHERE id = $1',
        { id: parseInt(id) }
      );
    };
    
    // Execute transaction
    await db.transaction(transaction);
    
    return true;
  } catch (error) {
    throw createError(`Error deleting site content: ${error.message}`, 500, error);
  }
};

/**
 * Get all survey questions
 * @returns {Promise<Array>} Survey questions with answer options
 */
const getAllSurveyQuestions = async () => {
  try {
    // Get questions
    const questions = await db.query(
      `SELECT sq.*, bt.business_type, ec.name as edu_category
       FROM survey_questions sq
       LEFT JOIN business_types bt ON sq.business_type_id = bt.id
       LEFT JOIN edu_categories ec ON sq.edu_category_id = ec.id
       ORDER BY sq.id`
    );
    
    // Get answer options for each question
    for (const question of questions) {
      const options = await db.query(
        `SELECT * FROM survey_questions_answer_options
         WHERE survey_question_id = $1
         ORDER BY id`,
        { id: question.id }
      );
      
      question.answerOptions = options;
    }
    
    return questions;
  } catch (error) {
    throw createError(`Error getting survey questions: ${error.message}`, 500, error);
  }
};

/**
 * Create a new survey question
 * @param {Object} questionData - Question data
 * @returns {Promise<Object>} Created question
 */
const createSurveyQuestion = async (questionData) => {
  try {
    const {
      question,
      businessTypeId,
      eduCategoryId,
      isActive,
      answerOptions
    } = questionData;
    
    const now = new Date().toISOString();
    
    // Create transaction
    const transaction = async (client) => {
      // Insert question
      const result = await client.query(
        `INSERT INTO survey_questions (
          question, business_type_id, edu_category_id, is_active, date_created
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        {
          question,
          businessTypeId: businessTypeId ? parseInt(businessTypeId) : null,
          eduCategoryId: eduCategoryId ? parseInt(eduCategoryId) : null,
          isActive: isActive !== undefined ? isActive : true,
          dateCreated: now
        }
      );
      
      const questionId = result[0].id;
      
      // Add answer options
      if (answerOptions && answerOptions.length > 0) {
        for (const option of answerOptions) {
          await client.query(
            `INSERT INTO survey_questions_answer_options (
              survey_question_id, answer_option
            ) VALUES ($1, $2)`,
            {
              surveyQuestionId: questionId,
              answerOption: option
            }
          );
        }
      }
      
      return questionId;
    };
    
    // Execute transaction
    const questionId = await db.transaction(transaction);
    
    // Get the created question with answer options
    const createdQuestion = await db.query(
      `SELECT sq.*, bt.business_type, ec.name as edu_category
       FROM survey_questions sq
       LEFT JOIN business_types bt ON sq.business_type_id = bt.id
       LEFT JOIN edu_categories ec ON sq.edu_category_id = ec.id
       WHERE sq.id = $1`,
      { id: questionId }
    );
    
    if (createdQuestion.length === 0) {
      throw createError('Question not found after creation', 500);
    }
    
    const question = createdQuestion[0];
    
    // Get answer options
    const options = await db.query(
      `SELECT * FROM survey_questions_answer_options
       WHERE survey_question_id = $1
       ORDER BY id`,
      { id: question.id }
    );
    
    question.answerOptions = options;
    
    return question;
  } catch (error) {
    throw createError(`Error creating survey question: ${error.message}`, 500, error);
  }
};

/**
 * Update a survey question
 * @param {string|number} id - Question ID
 * @param {Object} questionData - Question data to update
 * @returns {Promise<Object>} Updated question
 */
const updateSurveyQuestion = async (id, questionData) => {
  try {
    const {
      question,
      businessTypeId,
      eduCategoryId,
      isActive,
      answerOptions
    } = questionData;
    
    // Create transaction
    const transaction = async (client) => {
      // Update question
      await client.query(
        `UPDATE survey_questions
         SET question = $1,
             business_type_id = $2,
             edu_category_id = $3,
             is_active = $4
         WHERE id = $5`,
        {
          question,
          businessTypeId: businessTypeId ? parseInt(businessTypeId) : null,
          eduCategoryId: eduCategoryId ? parseInt(eduCategoryId) : null,
          isActive,
          id: parseInt(id)
        }
      );
      
      // Update answer options
      if (answerOptions) {
        // Delete existing options
        await client.query(
          'DELETE FROM survey_questions_answer_options WHERE survey_question_id = $1',
          { id: parseInt(id) }
        );
        
        // Add new options
        if (answerOptions.length > 0) {
          for (const option of answerOptions) {
            await client.query(
              `INSERT INTO survey_questions_answer_options (
                survey_question_id, answer_option
              ) VALUES ($1, $2)`,
              {
                surveyQuestionId: parseInt(id),
                answerOption: option
              }
            );
          }
        }
      }
    };
    
    // Execute transaction
    await db.transaction(transaction);
    
    // Get the updated question with answer options
    const updatedQuestion = await db.query(
      `SELECT sq.*, bt.business_type, ec.name as edu_category
       FROM survey_questions sq
       LEFT JOIN business_types bt ON sq.business_type_id = bt.id
       LEFT JOIN edu_categories ec ON sq.edu_category_id = ec.id
       WHERE sq.id = $1`,
      { id: parseInt(id) }
    );
    
    if (updatedQuestion.length === 0) {
      throw createError('Question not found', 404);
    }
    
    const question = updatedQuestion[0];
    
    // Get answer options
    const options = await db.query(
      `SELECT * FROM survey_questions_answer_options
       WHERE survey_question_id = $1
       ORDER BY id`,
      { id: question.id }
    );
    
    question.answerOptions = options;
    
    return question;
  } catch (error) {
    throw createError(`Error updating survey question: ${error.message}`, 500, error);
  }
};

/**
 * Delete a survey question
 * @param {string|number} id - Question ID
 * @returns {Promise<boolean>} Success status
 */
const deleteSurveyQuestion = async (id) => {
  try {
    // Create transaction
    const transaction = async (client) => {
      // Delete answer options
      await client.query(
        'DELETE FROM survey_questions_answer_options WHERE survey_question_id = $1',
        { id: parseInt(id) }
      );
      
      // Delete question
      await client.query(
        'DELETE FROM survey_questions WHERE id = $1',
        { id: parseInt(id) }
      );
    };
    
    // Execute transaction
    await db.transaction(transaction);
    
    return true;
  } catch (error) {
    throw createError(`Error deleting survey question: ${error.message}`, 500, error);
  }
};

/**
 * Get all messages with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated messages
 */
const getAllMessages = async (options) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isRead, 
      isReplied, 
      requiresReply, 
      category 
    } = options;
    
    const offset = (page - 1) * limit;
    
    // Build query conditions
    const conditions = [];
    const queryParams = { limit, offset };
    let paramIndex = 3;
    
    if (isRead !== undefined) {
      conditions.push(`m.is_read = $${paramIndex++}`);
      queryParams.isRead = isRead;
    }
    
    if (isReplied !== undefined) {
      conditions.push(`m.is_replied = $${paramIndex++}`);
      queryParams.isReplied = isReplied;
    }
    
    if (requiresReply !== undefined) {
      conditions.push(`m.requires_reply = $${paramIndex++}`);
      queryParams.requiresReply = requiresReply;
    }
    
    if (category) {
      conditions.push(`mc.name = $${paramIndex++}`);
      queryParams.category = category;
    }
    
    // Build WHERE clause
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    
    // Get messages
    const query = `
      SELECT m.*, mc.name as category, et.name as environment_type
      FROM messages m
      LEFT JOIN message_categories mc ON m.message_category_id = mc.id
      LEFT JOIN environment_types et ON m.environment_type_id = et.id
      ${whereClause}
      ORDER BY m.date_created DESC
      LIMIT $1 OFFSET $2
    `;
    
    const messages = await db.query(query, queryParams);
    
    // Count total messages
    const countQuery = `
      SELECT COUNT(*) FROM messages m
      LEFT JOIN message_categories mc ON m.message_category_id = mc.id
      ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, queryParams);
    
    const totalCount = parseInt(countResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      data: messages,
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
    throw createError(`Error getting all messages: ${error.message}`, 500, error);
  }
};

/**
 * Mark message as read
 * @param {string|number} id - Message ID
 * @returns {Promise<Object>} Updated message
 */
const markMessageAsRead = async (id) => {
  try {
    await db.query(
      'UPDATE messages SET is_read = TRUE WHERE id = $1',
      { id: parseInt(id) }
    );
    
    // Get the updated message
    const updatedMessage = await db.query(
      `SELECT m.*, mc.name as category, et.name as environment_type
       FROM messages m
       LEFT JOIN message_categories mc ON m.message_category_id = mc.id
       LEFT JOIN environment_types et ON m.environment_type_id = et.id
       WHERE m.id = $1`,
      { id: parseInt(id) }
    );
    
    if (updatedMessage.length === 0) {
      throw createError('Message not found', 404);
    }
    
    return updatedMessage[0];
  } catch (error) {
    throw createError(`Error marking message as read: ${error.message}`, 500, error);
  }
};

/**
 * Reply to a message
 * @param {string|number} id - Message ID
 * @param {Object} replyData - Reply data
 * @returns {Promise<Object>} Updated message
 */
const replyToMessage = async (id, replyData) => {
  try {
    const { replyText, repliedBy } = replyData;
    
    await db.query(
      `UPDATE messages 
       SET is_replied = TRUE, 
           reply_text = $1,
           replied_by = $2,
           replied_at = $3
       WHERE id = $4`,
      {
        replyText,
        repliedBy: parseInt(repliedBy),
        repliedAt: new Date().toISOString(),
        id: parseInt(id)
      }
    );
    
    // Get the updated message
    const updatedMessage = await db.query(
      `SELECT m.*, mc.name as category, et.name as environment_type
       FROM messages m
       LEFT JOIN message_categories mc ON m.message_category_id = mc.id
       LEFT JOIN environment_types et ON m.environment_type_id = et.id
       WHERE m.id = $1`,
      { id: parseInt(id) }
    );
    
    if (updatedMessage.length === 0) {
      throw createError('Message not found', 404);
    }
    
    return updatedMessage[0];
  } catch (error) {
    throw createError(`Error replying to message: ${error.message}`, 500, error);
  }
};

/**
 * Delete a message
 * @param {string|number} id - Message ID
 * @returns {Promise<boolean>} Success status
 */
const deleteMessage = async (id) => {
  try {
    await db.query(
      'DELETE FROM messages WHERE id = $1',
      { id: parseInt(id) }
    );
    
    return true;
  } catch (error) {
    throw createError(`Error deleting message: ${error.message}`, 500, error);
  }
};

/**
 * Get all ads with pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated ads
 */
const getAllAds = async (options) => {
  try {
    const { page = 1, limit = 10, isActive } = options;
    const offset = (page - 1) * limit;
    
    // Build query conditions
    const conditions = [];
    const queryParams = { limit, offset };
    let paramIndex = 3;
    
    if (isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex++}`);
      queryParams.isActive = isActive;
    }
    
    // Build WHERE clause
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    
    // Get ads
    const ads = await db.query(
      `SELECT * FROM ads
       ${whereClause}
       ORDER BY date_created DESC
       LIMIT $1 OFFSET $2`,
      queryParams
    );
    
    // Count total ads
    const countResult = await db.query(
      `SELECT COUNT(*) FROM ads ${whereClause}`,
      queryParams
    );
    
    const totalCount = parseInt(countResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      data: ads,
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
    throw createError(`Error getting all ads: ${error.message}`, 500, error);
  }
};

/**
 * Create a new ad
 * @param {Object} adData - Ad data
 * @returns {Promise<Object>} Created ad
 */
const createAd = async (adData) => {
  try {
    const {
      businessName,
      businessTelephone,
      content,
      expirationDate,
      imageURL,
      url,
      isActive
    } = adData;
    
    const now = new Date().toISOString();
    
    const result = await db.query(
      `INSERT INTO ads (
        business_name, business_telephone, content,
        expiration_date, image_url, url, is_active, date_created
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      {
        businessName,
        businessTelephone: businessTelephone || '',
        content,
        expirationDate: expirationDate || null,
        imageURL: imageURL || '',
        url: url || '',
        isActive: isActive !== undefined ? isActive : true,
        dateCreated: now
      }
    );
    
    const adId = result[0].id;
    
    // Get the created ad
    const createdAd = await db.query(
      'SELECT * FROM ads WHERE id = $1',
      { id: adId }
    );
    
    if (createdAd.length === 0) {
      throw createError('Ad not found after creation', 500);
    }
    
    return createdAd[0];
  } catch (error) {
    throw createError(`Error creating ad: ${error.message}`, 500, error);
  }
};

/**
 * Update an ad
 * @param {string|number} id - Ad ID
 * @param {Object} adData - Ad data to update
 * @returns {Promise<Object>} Updated ad
 */
const updateAd = async (id, adData) => {
  try {
    const {
      businessName,
      businessTelephone,
      content,
      expirationDate,
      imageURL,
      url,
      isActive
    } = adData;
    
    await db.query(
        `UPDATE ads
        SET business_name = $1,
            business_telephone = $2,
            content = $3,
            expiration_date = $4,
            image_url = $5,
            url = $6,
            is_active = $7
        WHERE id = $8`,
       {
         businessName,
         businessTelephone: businessTelephone || '',
         content,
         expirationDate: expirationDate || null,
         imageURL: imageURL || '',
         url: url || '',
         isActive,
         id: parseInt(id)
       }
     );
     
     // Get the updated ad
     const updatedAd = await db.query(
       'SELECT * FROM ads WHERE id = $1',
       { id: parseInt(id) }
     );
     
     if (updatedAd.length === 0) {
       throw createError('Ad not found', 404);
     }
     
     return updatedAd[0];
   } catch (error) {
     throw createError(`Error updating ad: ${error.message}`, 500, error);
   }
 };
 
 /**
  * Delete an ad
  * @param {string|number} id - Ad ID
  * @returns {Promise<boolean>} Success status
  */
 const deleteAd = async (id) => {
   try {
     await db.query(
       'DELETE FROM ads WHERE id = $1',
       { id: parseInt(id) }
     );
     
     return true;
   } catch (error) {
     throw createError(`Error deleting ad: ${error.message}`, 500, error);
   }
 };
 
 /**
  * Get user activity logs with pagination
  * @param {Object} options - Query options
  * @returns {Promise<Object>} Paginated logs
  */
 const getUserActivityLogs = async (options) => {
   try {
     const { 
       page = 1, 
       limit = 10, 
       eventType, 
       eventCategory, 
       startDate, 
       endDate 
     } = options;
     
     const offset = (page - 1) * limit;
     
     // Build query conditions
     const conditions = [];
     const queryParams = { limit, offset };
     let paramIndex = 3;
     
     if (eventType) {
       conditions.push(`event_type = $${paramIndex++}`);
       queryParams.eventType = eventType;
     }
     
     if (eventCategory) {
       conditions.push(`event_category = $${paramIndex++}`);
       queryParams.eventCategory = eventCategory;
     }
     
     if (startDate) {
       conditions.push(`occurred_at >= $${paramIndex++}`);
       queryParams.startDate = startDate;
     }
     
     if (endDate) {
       conditions.push(`occurred_at <= $${paramIndex++}`);
       queryParams.endDate = endDate;
     }
     
     // Build WHERE clause
     const whereClause = conditions.length > 0 
       ? `WHERE ${conditions.join(' AND ')}`
       : '';
     
     // Get logs
     const logs = await db.query(
       `SELECT l.*, u.first_name, u.last_name, u.display_name
        FROM user_activity_logs l
        JOIN users u ON l.user_id = u.id
        ${whereClause}
        ORDER BY l.occurred_at DESC
        LIMIT $1 OFFSET $2`,
       queryParams
     );
     
     // Count total logs
     const countResult = await db.query(
       `SELECT COUNT(*) FROM user_activity_logs ${whereClause}`,
       queryParams
     );
     
     const totalCount = parseInt(countResult[0].count);
     const totalPages = Math.ceil(totalCount / limit);
     
     return {
       data: logs,
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
     throw createError(`Error getting user activity logs: ${error.message}`, 500, error);
   }
 };
 
 /**
  * Get user activity logs by user
  * @param {string|number} userId - User ID
  * @param {Object} options - Query options
  * @returns {Promise<Object>} Paginated logs
  */
 const getUserActivityLogsByUser = async (userId, options) => {
   try {
     const { 
       page = 1, 
       limit = 10, 
       eventType, 
       eventCategory, 
       startDate, 
       endDate 
     } = options;
     
     const offset = (page - 1) * limit;
     
     // Build query conditions
     const conditions = [`user_id = $3`];
     const queryParams = { 
       limit, 
       offset,
       userId: parseInt(userId)
     };
     let paramIndex = 4;
     
     if (eventType) {
       conditions.push(`event_type = $${paramIndex++}`);
       queryParams.eventType = eventType;
     }
     
     if (eventCategory) {
       conditions.push(`event_category = $${paramIndex++}`);
       queryParams.eventCategory = eventCategory;
     }
     
     if (startDate) {
       conditions.push(`occurred_at >= $${paramIndex++}`);
       queryParams.startDate = startDate;
     }
     
     if (endDate) {
       conditions.push(`occurred_at <= $${paramIndex++}`);
       queryParams.endDate = endDate;
     }
     
     // Build WHERE clause
     const whereClause = `WHERE ${conditions.join(' AND ')}`;
     
     // Get logs
     const logs = await db.query(
       `SELECT l.*, u.first_name, u.last_name, u.display_name
        FROM user_activity_logs l
        JOIN users u ON l.user_id = u.id
        ${whereClause}
        ORDER BY l.occurred_at DESC
        LIMIT $1 OFFSET $2`,
       queryParams
     );
     
     // Count total logs
     const countResult = await db.query(
       `SELECT COUNT(*) FROM user_activity_logs ${whereClause}`,
       queryParams
     );
     
     const totalCount = parseInt(countResult[0].count);
     const totalPages = Math.ceil(totalCount / limit);
     
     return {
       data: logs,
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
     throw createError(`Error getting user activity logs: ${error.message}`, 500, error);
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