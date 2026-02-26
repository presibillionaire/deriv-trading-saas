const express = require('express');
const tradeController = require('../controllers/tradeController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.authenticate);

router.get('/', tradeController.getTrades);
router.post('/', tradeController.createTrade);
router.get('/stats', tradeController.getTradeStats);
router.get('/:id', tradeController.getTrade);
router.put('/:id', tradeController.updateTrade);
router.post('/:id/close', tradeController.closeTrade);

module.exports = router;
