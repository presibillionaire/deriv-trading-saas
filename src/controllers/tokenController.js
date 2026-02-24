const APIToken = require('../models/APIToken');
const User = require('../models/User');
const { encryptToken } = require('../utils/tokenEncryption');

// Connect a Deriv account
async function connectDerivAccount(req, res) {
  try {
    const { userId, derivToken, accountId, accountType, balance } = req.body;

    // Validate required fields
    if (!userId || !derivToken || !accountId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, derivToken, accountId' 
      });
    }

    // Validate user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ENCRYPT THE TOKEN HERE BEFORE SAVING
    console.log('🔒 Encrypting token in controller...');
    const encrypted = encryptToken(derivToken);
    console.log('✅ Token encrypted successfully');
    console.log('IV:', encrypted.iv);
    console.log('AuthTag:', encrypted.authTag);

    // Create token with already-encrypted values
    const token = await APIToken.create({
      userId,
      derivTokenEncrypted: encrypted.cipher,
      tokenIV: encrypted.iv,
      tokenAuthTag: encrypted.authTag,
      accountId,
      accountType: accountType || 'DEMO',
      balance: balance || 0,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    });

    res.status(201).json({
      message: 'Deriv account connected successfully',
      tokenId: token.id,
      accountId: token.accountId,
      accountType: token.accountType,
      balance: token.balance,
      expiresAt: token.expiresAt,
    });
  } catch (error) {
    console.error('Error connecting Deriv account:', error);
    res.status(500).json({ error: error.message });
  }
}

// Disconnect a Deriv account
async function disconnectDerivAccount(req, res) {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({ error: 'tokenId is required' });
    }

    await APIToken.update(
      { isActive: false, revocationReason: 'User disconnected account' },
      { where: { id: tokenId } }
    );

    res.json({ message: 'Deriv account disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Deriv account:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get all tokens for a user
async function getUserTokens(req, res) {
  try {
    const { userId } = req.params;

    const tokens = await APIToken.findAll({
      where: { userId },
      attributes: {
        exclude: ['derivTokenEncrypted', 'tokenIV', 'tokenAuthTag'],
      },
      order: [['createdAt', 'DESC']],
    });

    const activeTokens = tokens.map(token => ({
      id: token.id,
      accountId: token.accountId,
      accountType: token.accountType,
      balance: token.balance,
      isActive: token.isActive,
      isExpired: token.isExpired(),
      expiresAt: token.expiresAt,
      lastAccessedAt: token.lastAccessedAt,
      createdAt: token.createdAt,
    }));

    res.json(activeTokens);
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get decrypted token (for testing/verification)
async function getDecryptedToken(req, res) {
  try {
    const { tokenId } = req.params;

    const token = await APIToken.findByPk(tokenId);
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Decrypt and return the token
    const decryptedToken = token.getDecryptedToken();

    res.json({
      tokenId: token.id,
      decryptedToken,
      accountId: token.accountId,
      accountType: token.accountType,
      isValid: token.isValid(),
    });
  } catch (error) {
    console.error('Error decrypting token:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  connectDerivAccount,
  disconnectDerivAccount,
  getUserTokens,
  getDecryptedToken,
};
