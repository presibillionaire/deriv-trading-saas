const logger = require('../utils/logger');
const TradeHistory = require('../models/TradeHistory');

class TradeService {
  async calculateProfitLoss(trade) {
    try {
      if (!trade.exitPrice || !trade.entryPrice) {
        return 0;
      }

      // TODO: Implement profit/loss calculation based on trade details
      const difference = trade.exitPrice - trade.entryPrice;
      const profitLoss = difference > 0 ? trade.amount : -trade.amount;

      return profitLoss;
    } catch (error) {
      logger.error(`Failed to calculate P&L: ${error.message}`);
      throw error;
    }
  }

  async updateTradeStatus(tradeId, status, result, exitPrice) {
    try {
      const profit = await this.calculateProfitLoss({ exitPrice });

      const updatedTrade = await TradeHistory.findByIdAndUpdate(
        tradeId,
        {
          status,
          result,
          exitPrice,
          profit,
          exitTime: new Date(),
        },
        { new: true }
      );

      logger.info(`Trade updated: ${tradeId} - ${status} - ${result}`);
      return updatedTrade;
    } catch (error) {
      logger.error(`Failed to update trade: ${error.message}`);
      throw error;
    }
  }

  async getUserMetrics(userId) {
    try {
      const trades = await TradeHistory.find({ userId });

      return {
        totalTrades: trades.length,
        totalProfit: trades.reduce((sum, t) => sum + (t.profit || 0), 0),
        winRate: this.calculateWinRate(trades),
      };
    } catch (error) {
      logger.error(`Failed to get user metrics: ${error.message}`);
      throw error;
    }
  }

  calculateWinRate(trades) {
    if (trades.length === 0) return 0;
    const wins = trades.filter(t => t.result === 'WIN').length;
    return ((wins / trades.length) * 100).toFixed(2);
  }
}

module.exports = new TradeService();
