/**
 * Analytics Controller
 * Provides trading performance analytics and reporting
 */

const { Analytics, Account, Trade } = require('../models');
const logger = require('../utils/logger');

class AnalyticsController {
  /**
   * GET /api/analytics/dashboard - Dashboard overview
   */
  static async getDashboard(req, res, next) {
    try {
      const { accountId } = req.query;

      const whereClause = { userId: req.user.id };
      if (accountId) whereClause.accountId = accountId;

      // Get accounts
      const accounts = await Account.findAll({
        where: { userId: req.user.id }
      });

      // Get all trades
      const trades = await Trade.findAll({
        where: { userId: req.user.id }
      });

      // Get closed trades
      const closedTrades = trades.filter(t => t.status === 'closed');

      // Calculate metrics
      const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
      const totalEquity = accounts.reduce((sum, a) => sum + (a.equity || 0), 0);
      const totalProfit = closedTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);

      const winningTrades = closedTrades.filter(t => t.profitLoss > 0);
      const winRate = closedTrades.length > 0 
        ? ((winningTrades.length / closedTrades.length) * 100).toFixed(2)
        : 0;

      res.json({
        success: true,
        dashboard: {
          accounts: accounts.length,
          totalBalance: totalBalance.toFixed(2),
          totalEquity: totalEquity.toFixed(2),
          totalTrades: closedTrades.length,
          openTrades: trades.filter(t => t.status === 'open').length,
          winRate,
          totalProfit: totalProfit.toFixed(2),
          accountsList: accounts.map(a => ({
            id: a.id,
            name: a.accountName,
            type: a.accountType,
            balance: a.balance,
            status: a.status
          }))
        }
      });
    } catch (error) {
      logger.error('Dashboard error', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/analytics/performance - Account performance
   */
  static async getPerformance(req, res, next) {
    try {
      const { accountId } = req.query;

      let account;
      if (accountId) {
        account = await Account.findOne({
          where: { id: accountId, userId: req.user.id }
        });
      } else {
        account = await Account.findOne({
          where: { userId: req.user.id, isDefault: true }
        });
      }

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }

      const trades = await Trade.findAll({
        where: { accountId: account.id }
      });

      const closedTrades = trades.filter(t => t.status === 'closed');
      const winningTrades = closedTrades.filter(t => t.profitLoss > 0);

      const totalProfit = closedTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
      const avgWin = winningTrades.length > 0 
        ? (winningTrades.reduce((sum, t) => sum + t.profitLoss, 0) / winningTrades.length).toFixed(2)
        : 0;
      const avgLoss = closedTrades.filter(t => t.profitLoss <= 0).length > 0
        ? (closedTrades.filter(t => t.profitLoss <= 0).reduce((sum, t) => sum + t.profitLoss, 0) / closedTrades.filter(t => t.profitLoss <= 0).length).toFixed(2)
        : 0;

      res.json({
        success: true,
        performance: {
          accountId: account.id,
          accountName: account.accountName,
          totalTrades: closedTrades.length,
          winningTrades: winningTrades.length,
          losingTrades: closedTrades.length - winningTrades.length,
          winRate: closedTrades.length > 0 ? ((winningTrades.length / closedTrades.length) * 100).toFixed(2) : 0,
          totalProfit: totalProfit.toFixed(2),
          averageWin: avgWin,
          averageLoss: avgLoss,
          profitFactor: Math.abs(avgLoss) > 0 ? (Math.abs(avgWin / avgLoss)).toFixed(2) : 0,
          balance: account.balance,
          equity: account.equity
        }
      });
    } catch (error) {
      logger.error('Performance error', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/analytics/daily - Daily analytics
   */
  static async getDailyAnalytics(req, res, next) {
    try {
      const { accountId, startDate, endDate } = req.query;

      const whereClause = { userId: req.user.id };
      if (accountId) whereClause.accountId = accountId;

      const analytics = await Analytics.findAll({
        where: {
          userId: req.user.id,
          ...(startDate && { date: { [require('sequelize').Op.gte]: startDate } }),
          ...(endDate && { date: { [require('sequelize').Op.lte]: endDate } })
        },
        order: [['date', 'DESC']],
        limit: 30
      });

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Daily analytics error', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/analytics/reports - Generate report
   */
  static async getReport(req, res, next) {
    try {
      const { accountId, format = 'json' } = req.query;

      const account = await Account.findOne({
        where: { id: accountId, userId: req.user.id }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }

      const trades = await Trade.findAll({
        where: { accountId }
      });

      const report = {
        account: {
          id: account.id,
          name: account.accountName,
          type: account.accountType,
          currency: account.currency,
          balance: account.balance
        },
        summary: account.getPerformanceMetrics(),
        trades: trades,
        generatedAt: new Date()
      };

      if (format === 'csv') {
        // CSV format
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=trading-report.csv');
        // CSV conversion logic here
      } else {
        res.json({
          success: true,
          report
        });
      }
    } catch (error) {
      logger.error('Report generation error', { error: error.message });
      next(error);
    }
  }
}

module.exports = AnalyticsController;
