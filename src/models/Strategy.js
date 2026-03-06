const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Strategy = sequelize.define('Strategy', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING, // e.g., 'Martingale', 'RSI'
    allowNull: false
  },
  config: {
    type: DataTypes.JSON, // Stores strategy parameters
    allowNull: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  }
});

module.exports = Strategy;
