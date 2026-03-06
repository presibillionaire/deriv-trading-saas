const { User, TradeHistory } = require('../models'); 
const derivService = require('../services/derivService');
const logger = require('../utils/logger');

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
      data: { fullname: derivData.fullname, balance: derivData.balance, currency: derivData.currency }
    });
  } catch (error) {
    logger.error(`Connection error: ${error.message}`);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getBalance = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || !user.derivApiToken) return res.status(400).json({ success: false, message: 'No Deriv account linked' });
    const accountInfo = await derivService.getBalance(user.derivApiToken);
    res.json({ success: true, balance: accountInfo.balance, currency: accountInfo.currency });
  } catch (error) { next(error); }
};

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

    // 2. Save to PostgreSQL (Matching TradeHistory.js exactly)
    const loggedTrade = await TradeHistory.create({
      userId: userId,
      derivTradeId: String(tradeResult.contract_id),
      symbol: symbol,
      tradeType: contract_type.toUpperCase(), // Must be 'CALL' or 'PUT'
      entryPrice: tradeResult.purchase_price,
      amount: amount,
      duration: duration,
      status: 'OPEN',   // Uppercase per your model ENUM
      result: 'PENDING', // Uppercase per your model ENUM
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
            exitPrice: result.exitPrice || null, // Ensure your service returns this if possible
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
