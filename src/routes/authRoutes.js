/**
 * Authentication Routes
 */

const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();

/**
 * Validation Middleware
 */
const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 30 }).trim(),
  body('password').isLength({ min: 12 }),
  body('firstName').optional().trim(),
  body('lastName').optional().trim()
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * Public Routes
 */

// Register
router.post(
  '/register',
  validateRegister,
  validateRequest,
  authController.register
);

// Login
router.post(
  '/login',
  validateLogin,
  validateRequest,
  authController.login
);

// Refresh Token
router.post('/refresh', authController.refreshToken);

// Verify Email
router.post('/verify-email', authController.verifyEmail);

// Forgot Password
router.post(
  '/forgot-password',
  body('email').isEmail().normalizeEmail(),
  validateRequest,
  authController.forgotPassword
);

// Reset Password
router.post(
  '/reset-password',
  body('token').notEmpty(),
  body('password').isLength({ min: 12 }),
  validateRequest,
  authController.resetPassword
);

/**
 * Protected Routes
 */

// Change Password
router.post(
  '/change-password',
  authMiddleware.authenticate,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 12 }),
  validateRequest,
  authController.changePassword
);

module.exports = router;
