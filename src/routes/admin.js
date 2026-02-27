const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const User = require('../models/User');
const Strategy = require('../models/Strategy');
const InviteLink = require('../models/InviteLink');

// Middleware to check admin
router.use(authMiddleware, adminMiddleware);

// ===== USERS ROUTES =====

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'status', 'subscription', 'botAccess', 'createdAt'],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post('/users', async (req, res) => {
  try {
    const { username, email, subscription } = req.body;
    
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-10);
    
    const user = await User.create({
      username,
      email,
      password: tempPassword, // Hash this in real implementation
      subscription,
      status: 'active',
      botAccess: true,
      role: 'user',
    });

    res.json({
      message: 'User created successfully',
      user: { id: user.id, username, email, tempPassword },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle user status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { active } = req.body;
    await User.update(
      { status: active ? 'active' : 'inactive' },
      { where: { id: req.params.id } }
    );
    res.json({ message: 'User status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle bot access
router.patch('/users/:id/bot-access', async (req, res) => {
  try {
    const { botAccess } = req.body;
    await User.update(
      { botAccess },
      { where: { id: req.params.id } }
    );
    res.json({ message: 'Bot access updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== STRATEGIES ROUTES =====

// Get all strategies
router.get('/strategies', async (req, res) => {
  try {
    const strategies = await Strategy.findAll();
    res.json(strategies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload strategy file
router.post('/strategies/upload', async (req, res) => {
  try {
    const { name, description, icon, filePath } = req.body;
    
    const strategy = await Strategy.create({
      name,
      description,
      icon,
      filePath,
      enabled: true,
    });

    res.json({ message: 'Strategy uploaded', strategy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle strategy
router.patch('/strategies/:id/toggle', async (req, res) => {
  try {
    const strategy = await Strategy.findByPk(req.params.id);
    await strategy.update({ enabled: !strategy.enabled });
    res.json({ message: 'Strategy toggled', enabled: strategy.enabled });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== INVITE LINKS ROUTES =====

// Get all invite links
router.get('/invite-links', async (req, res) => {
  try {
    const links = await InviteLink.findAll();
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate new invite link
router.post('/invite-links', async (req, res) => {
  try {
    const { expiresIn } = req.body; // days
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    const expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);

    const link = await InviteLink.create({
      code,
      expiresAt,
      used: false,
      createdByAdmin: req.user.id,
    });

    res.json({ message: 'Invite link generated', link });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== BILLING ROUTES =====

// Get billing summary
router.get('/billing/summary', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'subscription', 'status'],
    });

    const summary = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      revenue: users.reduce((sum, u) => {
        const monthlyRate = {
          starter: 15000,
          pro: 25000,
          enterprise: 50000,
        };
        return sum + (monthlyRate[u.subscription] || 0);
      }, 0),
      subscriptions: {
        starter: users.filter(u => u.subscription === 'starter').length,
        pro: users.filter(u => u.subscription === 'pro').length,
        enterprise: users.filter(u => u.subscription === 'enterprise').length,
      },
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
