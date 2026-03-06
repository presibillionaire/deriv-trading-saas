const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/sequelize');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    lowercase: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstName: { type: DataTypes.STRING },
  lastName: { type: DataTypes.STRING },

  // --- ADD THE NEW STEP 1 FIELDS HERE ---
  derivApiToken: {
    type: DataTypes.STRING,
    allowNull: true, // This stays empty until they link their account
  },
  derivCurrency: {
    type: DataTypes.STRING,
    defaultValue: 'USD',
  },
  derivConnected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // ---------------------------------------

  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});

User.prototype.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
