const express = require('express');
const router = express.Router();
const derivController = require('../controllers/derivController');
const { authenticate } = require('../middleware/authentication');

router.use(authenticate);

router.post('/connect', derivController.connectAccount);
router.get('/accounts', derivController.getAccounts);
router.get('/account/:accountId', derivController.getAccountDetails);
router.post('/disconnect/:accountId', derivController.disconnectAccount);
router.get('/balance/:accountId', derivController.getBalance);

module.exports = router;
