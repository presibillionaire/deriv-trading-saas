const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const { sequelize } = require('./models');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const derivApiService = require('./services/derivApiService');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const accountRoutes = require('./routes/accountRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Security
app.use(helmet());

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Welcome
app.get('/', (req, res) => {
  res.json({
    message: 'Deriv Trading SaaS API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      accounts: '/api/accounts',
      trades: '/api/trades',
      analytics: '/api/analytics'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error Handler
app.use(errorHandler.handle);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connected');

    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('✅ Models synchronized');

    // Connect to Deriv API
    try {
      await derivApiService.connect();
    } catch (error) {
      logger.warn('⚠️ Deriv API connection failed - trading features will be limited', { error: error.message });
    }

    const server = app.listen(PORT, () => {
      logger.info(`✅ Server running on http://localhost:${PORT}`);
      logger.info(`📍 Health: http://localhost:${PORT}/health`);
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM: shutting down');
      server.close(async () => {
        derivApiService.disconnect();
        await sequelize.close();
        logger.info('Shutdown complete');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error(`❌ Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app;

// Add this line with other route imports
const adminRoutes = require('./routes/admin');

// Add this line with other app.use statements
app.use('/api/admin', adminRoutes);
