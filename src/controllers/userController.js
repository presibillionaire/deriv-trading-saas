/**
 * User Controller
 * Handles user profile, settings, and account management
 */

const { User } = require('../models');
const logger = require('../utils/logger');

class UserController {
  /**
   * GET /api/users/profile - Get current user profile
   */
  static async getProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        user: user.toJSON()
      });
    } catch (error) {
      logger.error('Get profile error', { error: error.message });
      next(error);
    }
  }

  /**
   * PUT /api/users/profile - Update user profile
   */
  static async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phoneNumber, bio, profileImageUrl } = req.body;

      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      await user.update({
        firstName,
        lastName,
        phoneNumber,
        bio,
        profileImageUrl
      });

      logger.info('User profile updated', { userId: req.user.id });

      res.json({
        success: true,
        user: user.toJSON(),
        message: 'Profile updated successfully'
      });
    } catch (error) {
      logger.error('Update profile error', { error: error.message });
      next(error);
    }
  }

  /**
   * PUT /api/users/settings - Update user settings
   */
  static async updateSettings(req, res, next) {
    try {
      const { notifications, emailAlerts, smsAlerts, theme } = req.body;

      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const settings = {
        ...user.settings,
        notifications: notifications !== undefined ? notifications : user.settings.notifications,
        emailAlerts: emailAlerts !== undefined ? emailAlerts : user.settings.emailAlerts,
        smsAlerts: smsAlerts !== undefined ? smsAlerts : user.settings.smsAlerts,
        theme: theme || user.settings.theme
      };

      await user.update({ settings });

      logger.info('User settings updated', { userId: req.user.id });

      res.json({
        success: true,
        settings,
        message: 'Settings updated successfully'
      });
    } catch (error) {
      logger.error('Update settings error', { error: error.message });
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id - Delete user account (Admin)
   */
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      await user.destroy();

      logger.info('User deleted', { userId: id, deletedBy: req.user.id });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Delete user error', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/users - List all users (Admin)
   */
  static async listUsers(req, res, next) {
    try {
      const { limit = 20, offset = 0 } = req.query;

      const users = await User.findAndCountAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: { exclude: ['password'] }
      });

      res.json({
        success: true,
        data: users.rows.map(u => u.toJSON()),
        pagination: {
          total: users.count,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      logger.error('List users error', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/users/:id - Get user by ID (Admin)
   */
  static async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        user: user.toJSON()
      });
    } catch (error) {
      logger.error('Get user error', { error: error.message });
      next(error);
    }
  }
}

module.exports = UserController;
