const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');
const User = require('./User');
const constants = require('../config/constants');

const TradeHistory = sequelize.define('TradeHistory', {
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
  derivTradeId: DataTypes.STRING,
  symbol: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tradeType: {
    type: DataTypes.ENUM('CALL', 'PUT'),
    allowNull: false,
  },
  entryPrice: DataTypes.DECIMAL(10, 5),
  exitPrice: DataTypes.DECIMAL(10, 5),
  amount: DataTypes.DECIMAL(10, 2),
  duration: DataTypes.INTEGER,
  status: {
    type: DataTypes.ENUM('PENDING', 'OPEN', 'WON', 'LOST', 'EXPIRED'),
    defaultValue: 'PENDING',
  },
  result: {
    type: DataTypes.ENUM('WIN', 'LOSS', 'PENDING'),
    defaultValue: 'PENDING',
  },
  profit: DataTypes.DECIMAL(10, 2),
  entryTime: DataTypes.DATE,
  exitTime: DataTypes.DATE,
  botGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
});

TradeHistory.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(TradeHistory, { foreignKey: 'userId' });

module.exports = TradeHistory;
