const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Strategy = sequelize.define('Strategy', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  icon: {
    type: DataTypes.STRING,
  },
  filePath: {
    type: DataTypes.STRING,
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = Strategy;
