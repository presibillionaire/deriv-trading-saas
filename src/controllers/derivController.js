const APIToken = require('../models/APIToken');
const User = require('../models/User');
const logger = require('../utils/logger');

exports.connectAccount = async (req, res, next) => {
  try {
    const { derivToken, accountType } = req.body;

    const apiToken = new APIToken({
      userId: req.userId,
      derivToken,
      accountType,
      isActive: true,
    });

    await apiToken.save();
    await User.findByIdAndUpdate(req.userId, { derivConnected: true });

    logger.info(`Deriv account connected for user: ${req.userId}`);

    res.status(201).json({
      message: 'Deriv account connected successfully',
      accountId: apiToken._id,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAccounts = async (req, res, next) => {
  try {
    const accounts = await APIToken.find({ userId: req.userId, isActive: true });

    res.json({
      accounts: accounts.map(acc => ({
        accountId: acc._id,
        accountType: acc.accountType,
        balance: acc.balance,
        lastSyncedAt: acc.lastSyncedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.getAccountDetails = async (req, res, next) => {
  try {
    const { accountId } = req.params;

    const account = await APIToken.findOne({
      _id: accountId,
      userId: req.userId,
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({ account });
  } catch (error) {
    next(error);
  }
};

exports.disconnectAccount = async (req, res, next) => {
  try {
    const { accountId } = req.params;

    await APIToken.findByIdAndUpdate(accountId, { isActive: false });

    logger.info(`Deriv account disconnected for user: ${req.userId}`);

    res.json({ message: 'Account disconnected successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getBalance = async (req, res, next) => {
  try {
    const { accountId } = req.params;

    const account = await APIToken.findOne({
      _id: accountId,
      userId: req.userId,
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({
      balance: account.balance,
      lastSyncedAt: account.lastSyncedAt,
    });
  } catch (error) {
    next(error);
  }
};
