const TradeHistory = require('../models/TradeHistory');
const logger = require('../utils/logger');

exports.executeTrade = async (req, res, next) => {
  try {
    const { symbol, tradeType, amount, duration, accountId } = req.body;

    const trade = new TradeHistory({
      userId: req.userId,
      symbol,
      tradeType,
      amount,
      duration,
      status: 'OPEN',
      result: 'PENDING',
      entryTime: new Date(),
      botGenerated: false,
    });

    await trade.save();

    logger.info(`Manual trade executed for user ${req.userId}: ${symbol} ${tradeType}`);

    res.status(201).json({
      message: 'Trade executed successfully',
      tradeId: trade._id,
      trade,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTradeHistory = async (req, res, next) => {
  try {
    const { limit = 20, skip = 0, status } = req.query;

    const query = { userId: req.userId };
    if (status) query.status = status;

    const trades = await TradeHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await TradeHistory.countDocuments(query);

    res.json({
      trades,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getTradeDetails = async (req, res, next) => {
  try {
    const { tradeId } = req.params;

    const trade = await TradeHistory.findOne({
      _id: tradeId,
      userId: req.userId,
    });

    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    res.json({ trade });
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const trades = await TradeHistory.find({
      userId: req.userId,
    });

    const totalTrades = trades.length;
    const wins = trades.filter(t => t.result === 'WIN').length;
    const losses = trades.filter(t => t.result === 'LOSS').length;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(2) : 0;
    const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0);

    res.json({
      stats: {
        totalTrades,
        wins,
        losses,
        winRate: `${winRate}%`,
        totalProfit,
      },
    });
  } catch (error) {
    next(error);
  }
};
