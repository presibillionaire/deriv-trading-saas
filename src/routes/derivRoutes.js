const express = require('express');
const router = express.Router();
const derivController = require('../controllers/derivController');
const AuthMiddleware = require('../middleware/authMiddleware'); 

// Connect Deriv account
router.post('/connect', AuthMiddleware.authenticate, derivController.connectAccount);

// Get account balance
router.get('/balance', AuthMiddleware.authenticate, derivController.getBalance);

// --- NEW: Execute a trade ---
router.post('/trade', AuthMiddleware.authenticate, derivController.placeTrade);

module.exports = router;
