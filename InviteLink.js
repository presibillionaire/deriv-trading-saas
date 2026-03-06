// src/models/InviteLink.js
const { DataTypes } = require('sequelize');
const sequelize = require('./index'); // points to index.js

const InviteLink = sequelize.define('InviteLink', {
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = InviteLink;
