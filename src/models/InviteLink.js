const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InviteLink = sequelize.define('InviteLink', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  createdByAdmin: {
    type: DataTypes.UUID,
    allowNull: false,
  },
});

module.exports = InviteLink;
