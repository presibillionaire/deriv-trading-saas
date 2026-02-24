const express = require('express');
const router = express.Router();
const {
  connectDerivAccount,
  disconnectDerivAccount,
  getUserTokens,
  getDecryptedToken,
} = require('../controllers/tokenController');

// Connect Deriv account
router.post('/connect', connectDerivAccount);

// Disconnect Deriv account
router.post('/disconnect', disconnectDerivAccount);

// Get user tokens
router.get('/user/:userId', getUserTokens);

// Get decrypted token (for testing)
router.get('/decrypt/:tokenId', getDecryptedToken);

module.exports = router;
