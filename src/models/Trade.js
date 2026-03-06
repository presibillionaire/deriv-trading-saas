const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trade = sequelize.define('Trade', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  contractId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true
  },
  symbol: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contractType: {
    type: DataTypes.STRING, // CALL or PUT
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  purchasePrice: {
    type: DataTypes.DECIMAL(10, 2)
  },
  status: {
    type: DataTypes.ENUM('open', 'won', 'lost', 'sold'),
    defaultValue: 'open'
  },
  payout: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  }
}, {
  timestamps: true
});

module.exports = Trade;
