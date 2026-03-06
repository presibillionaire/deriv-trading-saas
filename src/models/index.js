const { sequelize } = require('../config/database');
const User = require('./User');
const APIToken = require('./APIToken');
const BotConfig = require('./BotConfig');
const InviteLink = require('./InviteLink');
const Strategy = require('./Strategy');
const TradeHistory = require('./TradeHistory');

// ============================================
// SET UP ASSOCIATIONS (SQL Foreign Keys)
// ============================================

// User <-> APIToken (One-to-Many)
User.hasMany(APIToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
APIToken.belongsTo(User, { foreignKey: 'userId' });

// User <-> TradeHistory (One-to-Many)
User.hasMany(TradeHistory, { foreignKey: 'userId', onDelete: 'CASCADE' });
TradeHistory.belongsTo(User, { foreignKey: 'userId' });

// User <-> BotConfig (One-to-One or One-to-Many)
User.hasMany(BotConfig, { foreignKey: 'userId', onDelete: 'CASCADE' });
BotConfig.belongsTo(User, { foreignKey: 'userId' });

// User <-> Strategy (One-to-Many)
User.hasMany(Strategy, { foreignKey: 'userId', onDelete: 'CASCADE' });
Strategy.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  APIToken,
  BotConfig,
  InviteLink,
  Strategy,
  TradeHistory,
};
