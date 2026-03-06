const express = require('express');
const router = express.Router();
const derivController = require('../controllers/derivController');
const AuthMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(AuthMiddleware.authenticate);

// Account Actions
router.post('/connect', derivController.connectAccount);
router.get('/balance', derivController.getBalance);

// Trading Actions
router.post('/trade', derivController.placeTrade);
router.post('/sync', derivController.syncPendingTrades); // New Sync Route

// Data Retrieval
router.get('/history', derivController.getTradeHistory);
router.get('/stats', derivController.getTradeStats);

module.exports = router;
