/**
 * Account Controller
 * Manages Deriv trading accounts
 */

const { Account, User } = require('../models');
const logger = require('../utils/logger');

class AccountController {
  /**
   * GET /api/accounts - List user accounts
   */
  static async listAccounts(req, res, next) {
    try {
      const accounts = await Account.findAll({
        where: { userId: req.user.id }
      });

      res.json({
        success: true,
        accounts
      });
    } catch (error) {
      logger.error('List accounts error', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/accounts/:id - Get account details
   */
  static async getAccount(req, res, next) {
    try {
      const { id } = req.params;

      const account = await Account.findOne({
        where: { id, userId: req.user.id }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }

      res.json({
        success: true,
        account: {
          ...account.toJSON(),
          performance: account.getPerformanceMetrics()
        }
      });
    } catch (error) {
      logger.error('Get account error', { error: error.message });
      next(error);
    }
  }

  /**
   * POST /api/accounts - Link new Deriv account
   */
  static async createAccount(req, res, next) {
    try {
      const {
        derivAccountId,
        derivApiToken,
        accountName,
        accountType = 'demo'
      } = req.body;

      if (!derivAccountId || !derivApiToken) {
        return res.status(400).json({
          success: false,
          error: 'Deriv account ID and API token are required'
        });
      }

      // Check if account already linked
      const existingAccount = await Account.findOne({
        where: { derivAccountId }
      });

      if (existingAccount) {
        return res.status(400).json({
          success: false,
          error: 'This Deriv account is already linked'
        });
      }

      const account = await Account.create({
        userId: req.user.id,
        derivAccountId,
        derivApiToken,
        accountName: accountName || `${accountType} account`,
        accountType
      });

      logger.info('Account linked', { userId: req.user.id, derivAccountId });

      res.status(201).json({
        success: true,
        account,
        message: 'Account linked successfully'
      });
    } catch (error) {
      logger.error('Create account error', { error: error.message });
      next(error);
    }
  }

  /**
   * PUT /api/accounts/:id - Update account
   */
  static async updateAccount(req, res, next) {
    try {
      const { id } = req.params;
      const {
        accountName,
        tradingEnabled,
        autoTradingEnabled,
        riskPerTrade,
        maxDrawdown,
        dailyLossLimit
      } = req.body;

      const account = await Account.findOne({
        where: { id, userId: req.user.id }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }

      await account.update({
        accountName,
        tradingEnabled,
        autoTradingEnabled,
        riskPerTrade,
        maxDrawdown,
        dailyLossLimit
      });

      logger.info('Account updated', { userId: req.user.id, accountId: id });

      res.json({
        success: true,
        account,
        message: 'Account updated successfully'
      });
    } catch (error) {
      logger.error('Update account error', { error: error.message });
      next(error);
    }
  }

  /**
   * POST /api/accounts/:id/set-default - Set default account
   */
  static async setDefaultAccount(req, res, next) {
    try {
      const { id } = req.params;

      const account = await Account.findOne({
        where: { id, userId: req.user.id }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }

      await account.setAsDefault();

      logger.info('Default account set', { userId: req.user.id, accountId: id });

      res.json({
        success: true,
        message: 'Default account set successfully'
      });
    } catch (error) {
      logger.error('Set default account error', { error: error.message });
      next(error);
    }
  }

  /**
   * DELETE /api/accounts/:id - Unlink account
   */
  static async deleteAccount(req, res, next) {
    try {
      const { id } = req.params;

      const account = await Account.findOne({
        where: { id, userId: req.user.id }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }

      await account.destroy();

      logger.info('Account unlinked', { userId: req.user.id, accountId: id });

      res.json({
        success: true,
        message: 'Account unlinked successfully'
      });
    } catch (error) {
      logger.error('Delete account error', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/accounts/:id/performance - Get account performance
   */
  static async getAccountPerformance(req, res, next) {
    try {
      const { id } = req.params;

      const account = await Account.findOne({
        where: { id, userId: req.user.id }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }

      res.json({
        success: true,
        performance: account.getPerformanceMetrics()
      });
    } catch (error) {
      logger.error('Get performance error', { error: error.message });
      next(error);
    }
  }
}

module.exports = AccountController;
