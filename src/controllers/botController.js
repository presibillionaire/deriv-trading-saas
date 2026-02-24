const BotConfig = require('../models/BotConfig');
const logger = require('../utils/logger');

exports.createBot = async (req, res, next) => {
  try {
    const { name, symbol, tradeType, tradeAmount, duration, strategy, maxTradesPerDay } = req.body;

    const bot = new BotConfig({
      userId: req.userId,
      name,
      symbol,
      tradeType,
      tradeAmount,
      duration,
      strategy,
      maxTradesPerDay,
      status: 'INACTIVE',
    });

    await bot.save();

    logger.info(`Bot created for user ${req.userId}: ${name}`);

    res.status(201).json({
      message: 'Bot configuration created',
      botId: bot._id,
      bot,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBotConfigs = async (req, res, next) => {
  try {
    const bots = await BotConfig.find({ userId: req.userId });

    res.json({ bots });
  } catch (error) {
    next(error);
  }
};

exports.getBotConfig = async (req, res, next) => {
  try {
    const { botId } = req.params;

    const bot = await BotConfig.findOne({
      _id: botId,
      userId: req.userId,
    });

    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    res.json({ bot });
  } catch (error) {
    next(error);
  }
};

exports.updateBotConfig = async (req, res, next) => {
  try {
    const { botId } = req.params;
    const updates = req.body;

    const bot = await BotConfig.findOneAndUpdate(
      { _id: botId, userId: req.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    logger.info(`Bot updated for user ${req.userId}: ${botId}`);

    res.json({
      message: 'Bot configuration updated',
      bot,
    });
  } catch (error) {
    next(error);
  }
};

exports.startBot = async (req, res, next) => {
  try {
    const { botId } = req.params;

    const bot = await BotConfig.findOneAndUpdate(
      { _id: botId, userId: req.userId },
      { status: 'ACTIVE', enabled: true },
      { new: true }
    );

    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    logger.info(`Bot started for user ${req.userId}: ${botId}`);

    res.json({
      message: 'Bot started successfully',
      bot,
    });
  } catch (error) {
    next(error);
  }
};

exports.stopBot = async (req, res, next) => {
  try {
    const { botId } = req.params;

    const bot = await BotConfig.findOneAndUpdate(
      { _id: botId, userId: req.userId },
      { status: 'INACTIVE', enabled: false },
      { new: true }
    );

    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    logger.info(`Bot stopped for user ${req.userId}: ${botId}`);

    res.json({
      message: 'Bot stopped successfully',
      bot,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBot = async (req, res, next) => {
  try {
    const { botId } = req.params;

    const bot = await BotConfig.findOneAndDelete({
      _id: botId,
      userId: req.userId,
    });

    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' });
    }

    logger.info(`Bot deleted for user ${req.userId}: ${botId}`);

    res.json({
      message: 'Bot deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
