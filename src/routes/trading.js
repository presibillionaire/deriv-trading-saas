const express = require('express');
const router = express.Router();
const tradingController = require('../controllers/tradingController');
const { authenticate } = require('../middleware/authentication');
const { validateTrade } = require('../middleware/validation');

router.use(authenticate);

router.post('/manual-trade', validateTrade, tradingController.executeTrade);
router.get('/history', tradingController.getTradeHistory);
router.get('/history/:tradeId', tradingController.getTradeDetails);
router.get('/stats', tradingController.getStats);

module.exports = router;
