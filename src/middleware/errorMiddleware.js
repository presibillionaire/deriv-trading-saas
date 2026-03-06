const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log for development
  logger.error(`${err.name}: ${err.message}`);

  // Set status code (default to 500 if not specified)
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: error.message || 'Server Error',
    // Only show the stack trace if we are in development mode
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
