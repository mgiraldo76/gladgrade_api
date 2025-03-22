/**
 * Create an application error with additional metadata
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Error} originalError - Original error object if available
 * @returns {Error} Custom error object
 */
const createError = (message, statusCode = 500, originalError = null) => {
    const error = new Error(message);
    error.status = statusCode;
    error.isOperational = true;
    
    if (originalError) {
      error.stack = originalError.stack;
      error.originalError = originalError;
    }
    
    return error;
  };
  
  module.exports = {
    createError
  };