const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InviteLink = sequelize.define('InviteLink', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  usedBy: {
    type: DataTypes.UUID,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = InviteLink;
