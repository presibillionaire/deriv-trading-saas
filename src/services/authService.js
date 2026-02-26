/**
 * Authentication Service
 * Handles all auth logic: registration, login, JWT, password reset
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const crypto = require('crypto');

class AuthService {
  /**
   * Register new user
   */
  static async register(userData) {
    try {
      // Check if user exists
      const existingUser = await User.findOne({
        where: { email: userData.email.toLowerCase() }
      });

      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Validate password
      this.validatePassword(userData.password);

      // Create user
      const user = await User.create({
        email: userData.email.toLowerCase(),
        username: userData.username,
        password: userData.password,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null
      });

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      await user.update({
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      return {
        success: true,
        user: user.toJSON(),
        message: 'User registered successfully. Please verify your email.'
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Login user
   */
  static async login(email, password) {
    try {
      // Find user
      const user = await User.findByEmail(email);

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        throw new Error('Account is locked. Please try again later.');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        // Increment login attempts
        await user.incrementLoginAttempts();
        throw new Error('Invalid email or password');
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Generate tokens
      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      return {
        success: true,
        user: user.toJSON(),
        accessToken,
        refreshToken,
        expiresIn: parseInt(process.env.JWT_EXPIRY) || 7
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Generate access token (short-lived)
   */
  static generateAccessToken(userId) {
    return jwt.sign(
      { id: userId, type: 'access' },
      process.env.JWT_SECRET,
      {
        expiresIn: '15m',
        algorithm: 'HS256'
      }
    );
  }

  /**
   * Generate refresh token (long-lived)
   */
  static generateRefreshToken(userId) {
    return jwt.sign(
      { id: userId, type: 'refresh' },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d',
        algorithm: 'HS256'
      }
    );
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const user = await User.findByPk(decoded.id);

      if (!user) {
        throw new Error('User not found');
      }

      const newAccessToken = this.generateAccessToken(user.id);

      return {
        success: true,
        accessToken: newAccessToken,
        expiresIn: '15m'
      };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Verify email
   */
  static async verifyEmail(token) {
    try {
      const user = await User.findOne({
        where: { emailVerificationToken: token }
      });

      if (!user) {
        throw new Error('Invalid verification token');
      }

      if (user.emailVerificationExpires < new Date()) {
        throw new Error('Verification token has expired');
      }

      await user.update({
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      });

      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      throw new Error(`Email verification failed: ${error.message}`);
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email) {
    try {
      const user = await User.findByEmail(email);

      if (!user) {
        // Don't reveal if user exists
        return {
          success: true,
          message: 'If an account exists, password reset link will be sent'
        };
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      await user.update({
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
      });

      return {
        success: true,
        resetToken, // In production, send this via email
        message: 'Password reset link sent to email'
      };
    } catch (error) {
      throw new Error(`Password reset request failed: ${error.message}`);
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token, newPassword) {
    try {
      this.validatePassword(newPassword);

      const user = await User.findOne({
        where: { passwordResetToken: token }
      });

      if (!user) {
        throw new Error('Invalid reset token');
      }

      if (user.passwordResetExpires < new Date()) {
        throw new Error('Reset token has expired');
      }

      await user.update({
        password: newPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date()
      });

      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  /**
   * Change password (authenticated user)
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      this.validatePassword(newPassword);

      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      await user.update({
        password: newPassword,
        passwordChangedAt: new Date()
      });

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      throw new Error(`Password change failed: ${error.message}`);
    }
  }

  /**
   * Validate password strength
   */
  static validatePassword(password) {
    const minLength = 12;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    if (password.length < minLength) {
      throw new Error(`Password must be at least ${minLength} characters`);
    }

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      throw new Error(
        'Password must contain uppercase, lowercase, number, and special character'
      );
    }
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }
}

module.exports = AuthService;
