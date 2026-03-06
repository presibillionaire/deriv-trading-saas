const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.authenticate);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/performance', analyticsController.getPerformance);
router.get('/daily', analyticsController.getDailyAnalytics);
router.get('/reports', analyticsController.getReport);

module.exports = router;
