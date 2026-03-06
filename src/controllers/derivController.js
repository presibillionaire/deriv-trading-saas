const { User, TradeHistory } = require('../models');
const derivService = require('../services/derivService');
const logger = require('../utils/logger');
const { Sequelize } = require('sequelize');

/**
 * Links a Deriv API Token to the User Profile
 */
exports.connectAccount = async (req, res, next) => {
  try {
    const { derivToken } = req.body;
    const userId = req.user.id;

    logger.info(`Attempting to connect Deriv account for user: ${userId}`);
    const derivData = await derivService.validateToken(derivToken);

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await user.update({
      derivApiToken: derivToken,
      derivConnected: true,
      derivCurrency: derivData.currency || 'USD'
    });

    res.status(200).json({
      success: true,
      message: 'Deriv account connected successfully',
      data: { 
        fullname: derivData.fullname, 
        balance: derivData.balance, 
        currency: derivData.currency 
      }
    });
  } catch (error) {
    logger.error(`Connection error: ${error.message}`);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Fetches the current live balance from Deriv
 */
exports.getBalance = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || !user.derivApiToken) {
      return res.status(400).json({ success: false, message: 'No Deriv account linked' });
    }
    const accountInfo = await derivService.getBalance(user.derivApiToken);
    res.json({ success: true, balance: accountInfo.balance, currency: accountInfo.currency });
  } catch (error) {
    next(error);
  }
};

/**
 * Places a trade and sets a background timer to check the result
 */
exports.placeTrade = async (req, res, next) => {
  try {
    const { symbol, amount, contract_type, duration, duration_unit } = req.body;
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user || !user.derivApiToken) {
      return res.status(400).json({ success: false, message: 'Deriv account not linked.' });
    }

    // 1. Execute on Deriv
    const tradeResult = await derivService.executeTrade(user.derivApiToken, {
      symbol, amount, contract_type, duration, duration_unit
    });

    // 2. Save to PostgreSQL
    const loggedTrade = await TradeHistory.create({
      userId: userId,
      derivTradeId: String(tradeResult.contract_id),
      symbol: symbol,
      tradeType: contract_type.toUpperCase(),
      entryPrice: tradeResult.purchase_price,
      amount: amount,
      duration: duration,
      status: 'OPEN',
      result: 'PENDING',
      entryTime: new Date()
    });

    // 3. Set Automatic Result Checker
    const durationInSeconds = duration_unit === 'm' ? duration * 60 : duration;
    const delayMs = (durationInSeconds * 1000) + 5000;

    logger.info(`Trade ${tradeResult.contract_id} logged. Result check in ${delayMs / 1000}s`);

    setTimeout(async () => {
      try {
        const result = await derivService.getContractStatus(user.derivApiToken, tradeResult.contract_id);
        if (result.is_sold) {
          await loggedTrade.update({
            status: 'EXPIRED',
            result: result.status === 'won' ? 'WIN' : 'LOSS',
            profit: result.profit,
            exitPrice: result.exitPrice || null,
            exitTime: new Date()
          });
          logger.info(`Trade ${tradeResult.contract_id} settled: ${result.status.toUpperCase()}`);
        }
      } catch (err) {
        logger.error(`Background check failed for trade ${tradeResult.contract_id}: ${err.message}`);
      }
    }, delayMs);

    res.status(200).json({ success: true, message: 'Trade executed', data: loggedTrade });
  } catch (error) {
    logger.error(`Trade execution error: ${error.message}`);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Retrieves the last 50 trades for the user
 */
exports.getTradeHistory = async (req, res, next) => {
  try {
    const history = await TradeHistory.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculates total wins, losses, and win rate
 */
exports.getTradeStats = async (req, res, next) => {
  try {
    const stats = await TradeHistory.findAll({
      where: { userId: req.user.id },
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalTrades'],
        [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN result = 'WIN' THEN 1 ELSE 0 END")), 'wins'],
        [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN result = 'LOSS' THEN 1 ELSE 0 END")), 'losses'],
        [Sequelize.fn('SUM', Sequelize.col('profit')), 'totalProfit']
      ],
      raw: true
    });

    const data = stats[0] || {};
    const total = parseInt(data.totalTrades) || 0;
    const wins = parseInt(data.wins) || 0;

    res.json({
      success: true,
      data: {
        totalTrades: total,
        wins: wins,
        losses: parseInt(data.losses) || 0,
        winRate: total > 0 ? ((wins / total) * 100).toFixed(2) + '%' : '0%',
        totalProfit: parseFloat(data.totalProfit || 0).toFixed(2),
        currency: 'USD'
      }
    });
  } catch (error) {
    next(error);
  }
};
