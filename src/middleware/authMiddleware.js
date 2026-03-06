/**
 * Authentication Middleware
 * Validates JWT tokens and sets user context
 */

const authService = require('../services/authService');
const logger = require('../utils/logger');

class AuthMiddleware {
  /**
   * Authenticate user from JWT token
   */
  static authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Missing or invalid authorization header'
        });
      }

      const token = authHeader.slice(7);

      const decoded = authService.verifyToken(token);

      req.user = { id: decoded.id };

      next();
    } catch (error) {
      logger.warn('Authentication failed', { error: error.message });
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
  }

  /**
   * Authorize based on user role
   */
  static authorize(...roles) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'User not authenticated'
          });
        }

        const { User } = require('../models');
        const user = await User.findByPk(req.user.id);

        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'User not found'
          });
        }

        if (!roles.includes(user.role)) {
          logger.warn('Authorization failed', { userId: req.user.id, requiredRoles: roles });
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions'
          });
        }

        req.user.role = user.role;
        next();
      } catch (error) {
        logger.error('Authorization check failed', { error: error.message });
        res.status(500).json({
          success: false,
          error: 'Authorization failed'
        });
      }
    };
  }

  /**
   * Optional authentication (doesn't fail if no token)
   */
  static optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const decoded = authService.verifyToken(token);
        req.user = { id: decoded.id };
      }

      next();
    } catch (error) {
      // Continue without user
      next();
    }
  }
}

module.exports = AuthMiddleware;
