const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController');
const { authenticate } = require('../middleware/authentication');

router.use(authenticate);

router.post('/create', botController.createBot);
router.get('/configs', botController.getBotConfigs);
router.get('/config/:botId', botController.getBotConfig);
router.put('/config/:botId', botController.updateBotConfig);
router.post('/start/:botId', botController.startBot);
router.post('/stop/:botId', botController.stopBot);
router.delete('/delete/:botId', botController.deleteBot);

module.exports = router;
