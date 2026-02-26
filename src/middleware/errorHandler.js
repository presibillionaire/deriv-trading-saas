/**
 * Error Handler Middleware
 * Global error handling
 */

const logger = require('../utils/logger');

class ErrorHandler {
  static handle(err, req, res, next) {
    logger.error('Error', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    });

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: err.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    // Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Duplicate entry',
        field: err.errors[0]?.path
      });
    }

    res.status(statusCode).json({
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
}

module.exports = ErrorHandler;
