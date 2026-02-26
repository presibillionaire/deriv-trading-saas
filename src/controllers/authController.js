/**
 * Authentication Controller
 * Handles HTTP requests for auth endpoints
 */

const authService = require('../services/authService');
const logger = require('../utils/logger');

class AuthController {
  /**
   * POST /api/auth/register
   */
  static async register(req, res, next) {
    try {
      const { email, username, password, firstName, lastName } = req.body;

      // Validate input
      if (!email || !username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email, username, and password are required'
        });
      }

      const result = await authService.register({
        email,
        username,
        password,
        firstName,
        lastName
      });

      logger.info('User registered', { email, username });

      res.status(201).json(result);
    } catch (error) {
      logger.error('Registration error', { error: error.message });
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      const result = await authService.login(email, password);

      logger.info('User logged in', { email });

      res.status(200).json(result);
    } catch (error) {
      logger.warn('Login failed', { email: req.body.email, error: error.message });
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/auth/refresh
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
      }

      const result = await authService.refreshToken(refreshToken);

      res.status(200).json(result);
    } catch (error) {
      logger.warn('Token refresh failed', { error: error.message });
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/auth/verify-email
   */
  static async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Verification token is required'
        });
      }

      const result = await authService.verifyEmail(token);

      logger.info('Email verified');

      res.status(200).json(result);
    } catch (error) {
      logger.warn('Email verification failed', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const result = await authService.requestPasswordReset(email);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Password reset request failed', { error: error.message });
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({
          success: false,
          error: 'Token and password are required'
        });
      }

      const result = await authService.resetPassword(token, password);

      logger.info('Password reset successful');

      res.status(200).json(result);
    } catch (error) {
      logger.warn('Password reset failed', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/auth/change-password
   */
  static async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current and new password are required'
        });
      }

      const result = await authService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      logger.info('Password changed', { userId });

      res.status(200).json(result);
    } catch (error) {
      logger.warn('Password change failed', { userId: req.user.id, error: error.message });
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = AuthController;
