const User = require('../models/User');
const derivService = require('../services/derivService');
const logger = require('../utils/logger');

exports.connectAccount = async (req, res, next) => {
  try {
    const { derivToken } = req.body;
    const userId = req.user.id; 

    logger.info(`Attempting to connect Deriv account for user: ${userId}`);

    const derivData = await derivService.validateToken(derivToken);

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

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

exports.getBalance = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user || !user.derivApiToken) {
      return res.status(400).json({ success: false, message: 'No Deriv account linked' });
    }

    const accountInfo = await derivService.getBalance(user.derivApiToken);
    
    res.json({
      success: true,
      balance: accountInfo.balance,
      currency: accountInfo.currency
    });
  } catch (error) {
    next(error);
  }
};

// --- NEW TRADE EXECUTION METHOD ---
exports.placeTrade = async (req, res, next) => {
  try {
    const { symbol, amount, contract_type, duration, duration_unit } = req.body;
    
    // Find the user to get their Deriv Token from the database
    const user = await User.findByPk(req.user.id);

    if (!user || !user.derivApiToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Deriv account not linked. Please connect your account first.' 
      });
    }

    logger.info(`User ${user.id} placing ${contract_type} trade on ${symbol}`);

    const tradeResult = await derivService.executeTrade(user.derivApiToken, {
      symbol,
      amount,
      contract_type,
      duration,
      duration_unit
    });

    res.status(200).json({
      success: true,
      message: 'Trade executed successfully',
      data: tradeResult
    });
  } catch (error) {
    logger.error(`Trade execution error: ${error.message}`);
    res.status(400).json({ success: false, error: error.message });
  }
};
