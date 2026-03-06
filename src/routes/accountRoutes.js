const express = require('express');
const accountController = require('../controllers/accountController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.authenticate);

router.get('/', accountController.listAccounts);
router.post('/', accountController.createAccount);
router.get('/:id', accountController.getAccount);
router.put('/:id', accountController.updateAccount);
router.post('/:id/set-default', accountController.setDefaultAccount);
router.get('/:id/performance', accountController.getAccountPerformance);
router.delete('/:id', accountController.deleteAccount);

module.exports = router;
