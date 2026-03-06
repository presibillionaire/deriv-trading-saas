const User = require('../models/User');
const derivService = require('../services/derivService');
const logger = require('../utils/logger');

exports.connectAccount = async (req, res, next) => {
  try {
    const { derivToken } = req.body;
    // Note: req.user.id comes from your protect/auth middleware
    const userId = req.user.id; 

    logger.info(`Attempting to connect Deriv account for user: ${userId}`);

    // 1. Actually talk to Deriv to see if this token is real
    const derivData = await derivService.validateToken(derivToken);

    // 2. Update the User in Postgres (Sequelize syntax)
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
