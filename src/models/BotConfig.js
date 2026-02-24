const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');
const User = require('./User');

const BotConfig = sequelize.define('BotConfig', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  symbol: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tradeType: {
    type: DataTypes.ENUM('CALL', 'PUT'),
  },
  tradeAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 300,
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'ERROR'),
    defaultValue: 'INACTIVE',
  },
  strategy: {
    type: DataTypes.ENUM('RANDOM', 'SIGNAL_BASED', 'MARTINGALE'),
    defaultValue: 'RANDOM',
  },
  maxTradesPerDay: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  stopLoss: DataTypes.DECIMAL(10, 2),
  takeProfit: DataTypes.DECIMAL(10, 2),
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
});

BotConfig.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(BotConfig, { foreignKey: 'userId' });

module.exports = BotConfig;
