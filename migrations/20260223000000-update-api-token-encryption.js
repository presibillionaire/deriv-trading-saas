'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, check if columns already exist before adding them
    const table = await queryInterface.describeTable('APITokens');
    
    // Add tokenIV column
    if (!table.tokenIV) {
      await queryInterface.addColumn('APITokens', 'tokenIV', {
        type: Sequelize.STRING(32),
        allowNull: true,
      });
    }

    // Add tokenAuthTag column
    if (!table.tokenAuthTag) {
      await queryInterface.addColumn('APITokens', 'tokenAuthTag', {
        type: Sequelize.STRING(32),
        allowNull: true,
      });
    }

    // Add expiresAt column
    if (!table.expiresAt) {
      await queryInterface.addColumn('APITokens', 'expiresAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    // Add lastAccessedAt column
    if (!table.lastAccessedAt) {
      await queryInterface.addColumn('APITokens', 'lastAccessedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    // Add rotatedAt column
    if (!table.rotatedAt) {
      await queryInterface.addColumn('APITokens', 'rotatedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    // Add revocationReason column
    if (!table.revocationReason) {
      await queryInterface.addColumn('APITokens', 'revocationReason', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Change balance to higher precision
    if (table.balance) {
      await queryInterface.changeColumn('APITokens', 'balance', {
        type: Sequelize.DECIMAL(15, 4),
        defaultValue: 0,
      });
    }

    // Rename derivToken to derivTokenEncrypted if it exists
    if (table.derivToken && !table.derivTokenEncrypted) {
      await queryInterface.renameColumn('APITokens', 'derivToken', 'derivTokenEncrypted');
    }
  },

  async down(queryInterface, Sequelize) {
    // Reverse the migration (rollback)
    const table = await queryInterface.describeTable('APITokens');

    if (table.tokenIV) {
      await queryInterface.removeColumn('APITokens', 'tokenIV');
    }
    if (table.tokenAuthTag) {
      await queryInterface.removeColumn('APITokens', 'tokenAuthTag');
    }
    if (table.expiresAt) {
      await queryInterface.removeColumn('APITokens', 'expiresAt');
    }
    if (table.lastAccessedAt) {
      await queryInterface.removeColumn('APITokens', 'lastAccessedAt');
    }
    if (table.rotatedAt) {
      await queryInterface.removeColumn('APITokens', 'rotatedAt');
    }
    if (table.revocationReason) {
      await queryInterface.removeColumn('APITokens', 'revocationReason');
    }

    // Restore old balance precision
    if (table.balance) {
      await queryInterface.changeColumn('APITokens', 'balance', {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      });
    }

    // Rename back to derivToken
    if (table.derivTokenEncrypted && !table.derivToken) {
      await queryInterface.renameColumn('APITokens', 'derivTokenEncrypted', 'derivToken');
    }
  }
};
