const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
  
    // Default error status and message
    let status = err.status || 500;
    let message = err.message || 'Internal Server Error';
    
    // Database connection errors
    if (err.code === '08003' || err.code === '08006' || err.code === '57P01') {
      status = 503;
      message = 'Database connection error';
    }
    
    // Query errors
    if (err.code === '42P01') {
      status = 500;
      message = 'Database query error';
    }
    
    // Constraint violations
    if (err.code === '23505') {
      status = 409;
      message = 'Duplicate entry';
    }
    
    // Foreign key violations
    if (err.code === '23503') {
      status = 400;
      message = 'Referenced record does not exist';
    }
    
    // Custom application errors
    if (err.isOperational) {
      status = err.status;
      message = err.message;
    }
    
    // Send JSON response
    res.status(status).json({
      error: {
        message,
        status,
        // Only include stack in development mode
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
  };
  
  module.exports = errorHandler;