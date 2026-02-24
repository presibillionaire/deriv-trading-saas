const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');
const { decryptToken } = require('../utils/tokenEncryption');

const APIToken = sequelize.define('APIToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  // Encrypted token storage
  derivTokenEncrypted: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  // Initialization vector for decryption
  tokenIV: {
    type: DataTypes.STRING(32),
    allowNull: false,
  },
  // Auth tag for AES-GCM authentication
  tokenAuthTag: {
    type: DataTypes.STRING(32),
    allowNull: false,
  },
  accountId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  accountType: {
    type: DataTypes.ENUM('REAL', 'DEMO'),
    defaultValue: 'DEMO',
  },
  balance: {
    type: DataTypes.DECIMAL(15, 4),
    defaultValue: 0,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastAccessedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rotatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  revocationReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

/**
 * Instance method to get decrypted token
 */
APIToken.prototype.getDecryptedToken = function() {
  try {
    return decryptToken(
      this.derivTokenEncrypted,
      this.tokenIV,
      this.tokenAuthTag
    );
  } catch (error) {
    throw new Error(`Failed to decrypt token: ${error.message}`);
  }
};

/**
 * Instance method to check if token is expired
 */
APIToken.prototype.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > new Date(this.expiresAt);
};

/**
 * Instance method to check if token is valid
 */
APIToken.prototype.isValid = function() {
  return this.isActive && !this.isExpired();
};

/**
 * Instance method to update last accessed time
 */
APIToken.prototype.updateLastAccessed = function() {
  return this.update({ lastAccessedAt: new Date() });
};

// Set up associations
const setupAssociations = () => {
  const User = require('./User');
  APIToken.belongsTo(User, { foreignKey: 'userId' });
  User.hasMany(APIToken, { foreignKey: 'userId' });
};

setupAssociations();

module.exports = APIToken;
