const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protected routes
router.use(authMiddleware.authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/settings', userController.updateSettings);

// Admin routes
router.get('/', authMiddleware.authorize('admin'), userController.listUsers);
router.get('/:id', authMiddleware.authorize('admin'), userController.getUserById);
router.delete('/:id', authMiddleware.authorize('admin'), userController.deleteUser);

module.exports = router;
