const express = require('express');
const router = express.Router();
const derivController = require('../controllers/derivController');
// Changed { protect } to AuthMiddleware
const AuthMiddleware = require('../middleware/authMiddleware'); 

// Use AuthMiddleware.authenticate instead of protect
router.post('/connect', AuthMiddleware.authenticate, derivController.connectAccount);
router.get('/balance', AuthMiddleware.authenticate, derivController.getBalance);

module.exports = router;
