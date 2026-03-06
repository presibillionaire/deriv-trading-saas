/**
 * Trade Controller
 * Handles trade creation, management, and history
 */

const { Trade, Account } = require('../models');
const logger = require('../utils/logger');

class TradeController {
  /**
   * GET /api/trades - Get user trades
   */
  static async getTrades(req, res, next) {
    try {
      const { accountId, status, symbol, limit = 50, offset = 0 } = req.query;

      const whereClause = { userId: req.user.id };

      if (accountId) whereClause.accountId = accountId;
      if (status) whereClause.status = status;
      if (symbol) whereClause.symbol = symbol;

      const trades = await Trade.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['openedAt', 'DESC']]
      });

      res.json({
        success: true,
        data: trades.rows,
        pagination: {
          total: trades.count,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      logger.error('Get trades error', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/trades/:id - Get trade details
   */
  static async getTrade(req, res, next) {
    try {
      const { id } = req.params;

      const trade = await Trade.findOne({
        where: { id, userId: req.user.id }
      });

      if (!trade) {
        return res.status(404).json({
          success: false,
          error: 'Trade not found'
        });
      }

      res.json({
        success: true,
        trade
      });
    } catch (error) {
      logger.error('Get trade error', { error: error.message });
      next(error);
    }
  }

  /**
   * POST /api/trades - Create new trade
   */
  static async createTrade(req, res, next) {
    try {
      const {
        accountId,
        symbol,
        tradeType,
        entryPrice,
        quantity,
        stopLoss,
        takeProfit,
        strategy,
        notes
      } = req.body;

      // Validate account ownership
      const account = await Account.findOne({
        where: { id: accountId, userId: req.user.id }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }

      if (!account.tradingEnabled) {
        return res.status(400).json({
          success: false,
          error: 'Trading is not enabled for this account'
        });
      }

      const trade = await Trade.create({
        accountId,
        userId: req.user.id,
        symbol,
        tradeType,
        entryPrice,
        quantity,
        stopLoss,
        takeProfit,
        strategy,
        notes,
        status: 'open'
      });

      logger.info('Trade created', { userId: req.user.id, tradeId: trade.id });

      res.status(201).json({
        success: true,
        trade,
        message: 'Trade created successfully'
      });
    } catch (error) {
      logger.error('Create trade error', { error: error.message });
      next(error);
    }
  }

  /**
   * POST /api/trades/:id/close - Close a trade
   */
  static async closeTrade(req, res, next) {
    try {
      const { id } = req.params;
      const { exitPrice, notes } = req.body;

      const trade = await Trade.findOne({
        where: { id, userId: req.user.id }
      });

      if (!trade) {
        return res.status(404).json({
          success: false,
          error: 'Trade not found'
        });
      }

      if (trade.status === 'closed') {
        return res.status(400).json({
          success: false,
          error: 'Trade is already closed'
        });
      }

      await trade.closeTrade(exitPrice, notes);

      // Update account stats
      const account = await Account.findByPk(trade.accountId);
      if (account) {
        const totalTrades = await Trade.count({
          where: { accountId: trade.accountId, status: 'closed' }
        });
        const winningTrades = await Trade.count({
          where: { accountId: trade.accountId, status: 'closed', profitLoss: { [require('sequelize').Op.gt]: 0 } }
        });
        const totalProfit = await Trade.sum('profitLoss', {
          where: { accountId: trade.accountId, status: 'closed' }
        });

        await account.update({
          totalTrades,
          winningTrades,
          losingTrades: totalTrades - winningTrades,
          totalProfit: totalProfit || 0,
          winRate: totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(2) : 0
        });
      }

      logger.info('Trade closed', { userId: req.user.id, tradeId: id });

      res.json({
        success: true,
        trade,
        message: 'Trade closed successfully'
      });
    } catch (error) {
      logger.error('Close trade error', { error: error.message });
      next(error);
    }
  }

  /**
   * PUT /api/trades/:id - Update trade (SL/TP)
   */
  static async updateTrade(req, res, next) {
    try {
      const { id } = req.params;
      const { stopLoss, takeProfit, notes } = req.body;

      const trade = await Trade.findOne({
        where: { id, userId: req.user.id }
      });

      if (!trade) {
        return res.status(404).json({
          success: false,
          error: 'Trade not found'
        });
      }

      await trade.update({ stopLoss, takeProfit, notes });

      logger.info('Trade updated', { userId: req.user.id, tradeId: id });

      res.json({
        success: true,
        trade,
        message: 'Trade updated successfully'
      });
    } catch (error) {
      logger.error('Update trade error', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/trades/stats - Get trade statistics
   */
  static async getTradeStats(req, res, next) {
    try {
      const { accountId } = req.query;

      const whereClause = { userId: req.user.id };
      if (accountId) whereClause.accountId = accountId;

      const closedTrades = await Trade.findAll({
        where: { ...whereClause, status: 'closed' }
      });

      const openTrades = await Trade.findAll({
        where: { ...whereClause, status: 'open' }
      });

      const winningTrades = closedTrades.filter(t => t.isProfitable());
      const losingTrades = closedTrades.filter(t => !t.isProfitable());

      const totalProfit = closedTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
      const winRate = closedTrades.length > 0 
        ? ((winningTrades.length / closedTrades.length) * 100).toFixed(2)
        : 0;

      res.json({
        success: true,
        stats: {
          totalTrades: closedTrades.length,
          openTrades: openTrades.length,
          winningTrades: winningTrades.length,
          losingTrades: losingTrades.length,
          winRate,
          totalProfit: totalProfit.toFixed(2),
          averageWin: winningTrades.length > 0 
            ? (winningTrades.reduce((sum, t) => sum + t.profitLoss, 0) / winningTrades.length).toFixed(2)
            : 0,
          averageLoss: losingTrades.length > 0 
            ? (losingTrades.reduce((sum, t) => sum + t.profitLoss, 0) / losingTrades.length).toFixed(2)
            : 0
        }
      });
    } catch (error) {
      logger.error('Get stats error', { error: error.message });
      next(error);
    }
  }
}

module.exports = TradeController;
