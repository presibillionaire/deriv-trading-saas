const derivService = require('../services/derivService');
const { User, TradeHistory } = require('../models');
const logger = require('../utils/logger');

exports.connectAccount = async (req, res, next) => {
  try {
    const { derivToken } = req.body;
    const accountInfo = await derivService.authorize(derivToken);

    await User.update(
      { 
        derivApiToken: derivToken,
        derivConnected: true,
        derivCurrency: accountInfo.currency
      },
      { where: { id: req.user.id } }
    );

    res.json({
      success: true,
      message: 'Deriv account connected successfully',
      data: accountInfo
    });
  } catch (error) { next(error); }
};

exports.getBalance = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user.derivApiToken) {
      return res.status(400).json({ success: false, error: 'Deriv not connected' });
    }
    const balance = await derivService.getBalance(user.derivApiToken);
    res.json({ success: true, data: balance });
  } catch (error) { next(error); }
};

exports.placeTrade = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    const tradeData = await derivService.placeTrade(user.derivApiToken, req.body);

    const trade = await TradeHistory.create({
      userId: user.id,
      derivTradeId: tradeData.contract_id.toString(),
      symbol: req.body.symbol,
      tradeType: req.body.contract_type,
      entryPrice: tradeData.buy_price.toString(),
      amount: req.body.amount.toString(),
      duration: req.body.duration,
      status: 'OPEN',
      result: 'PENDING',
      entryTime: new Date()
    });

    // Background check after duration + buffer
    const waitTime = (req.body.duration * 2000) + 5000; 
    setTimeout(async () => {
      try {
        const result = await derivService.getContractStatus(user.derivApiToken, trade.derivTradeId);
        if (result.is_sold) {
          await trade.update({
            status: 'EXPIRED',
            result: result.status === 'won' ? 'WIN' : 'LOSS',
            profit: result.profit,
            exitPrice: result.exitPrice || null,
            exitTime: new Date()
          });
        }
      } catch (err) { logger.error('Background check failed', err); }
    }, waitTime);

    res.json({ success: true, message: 'Trade executed', data: trade });
  } catch (error) { next(error); }
};

exports.getTradeHistory = async (req, res, next) => {
  try {
    const history = await TradeHistory.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: history });
  } catch (error) { next(error); }
};

exports.getTradeStats = async (req, res, next) => {
  try {
    const trades = await TradeHistory.findAll({ where: { userId: req.user.id } });
    const wins = trades.filter(t => t.result === 'WIN');
    const losses = trades.filter(t => t.result === 'LOSS');
    const totalProfit = trades.reduce((sum, t) => sum + parseFloat(t.profit || 0), 0);

    res.json({
      success: true,
      data: {
        totalTrades: trades.length,
        wins: wins.length,
        losses: losses.length,
        winRate: trades.length > 0 ? ((wins.length / (wins.length + losses.length || 1)) * 100).toFixed(2) + '%' : '0.00%',
        totalProfit: totalProfit.toFixed(2),
        currency: 'USD'
      }
    });
  } catch (error) { next(error); }
};

// --- NEW SYNC FUNCTION ---
exports.syncPendingTrades = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    const pendingTrades = await TradeHistory.findAll({
      where: { userId: req.user.id, result: 'PENDING' }
    });

    let updatedCount = 0;
    for (const trade of pendingTrades) {
      const result = await derivService.getContractStatus(user.derivApiToken, trade.derivTradeId);
      if (result.is_sold) {
        await trade.update({
          status: 'EXPIRED',
          result: result.status === 'won' ? 'WIN' : 'LOSS',
          profit: result.profit,
          exitPrice: result.exitPrice || null,
          exitTime: new Date()
        });
        updatedCount++;
      }
    }

    res.json({ success: true, message: `Synced ${updatedCount} trades.`, totalChecked: pendingTrades.length });
  } catch (error) { next(error); }
};
