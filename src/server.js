/**
 * Main Server File - Express Application
 * Phase 3: With models, routes, and middleware
 */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Import models and database
const { sequelize } = require('./models');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');

// Initialize Express app
const app = express();

/**
 * Security Middleware
 */
app.use(helmet());

/**
 * CORS Configuration
 */
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
};
app.use(cors(corsOptions));

/**
 * Rate Limiting
 */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

/**
 * Body Parser Middleware
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);

/**
 * Welcome Endpoint
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Deriv Trading SaaS API',
    version: '1.0.0',
    status: 'running'
  });
});

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

/**
 * Error Handling Middleware
 */
app.use(errorHandler.handle);

/**
 * Database Connection & Server Start
 */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Authenticate database
    await sequelize.authenticate();
    logger.info('✅ Database connection successful');

    // Sync models
    await sequelize.sync({
      alter: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development' ? console.log : false
    });
    logger.info('✅ Database models synchronized');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`✅ Server running on http://localhost:${PORT}`);
      logger.info(`📍 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API docs will be at: http://localhost:${PORT}/api-docs`);
    });

    /**
     * Graceful Shutdown
     */
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing server');
      server.close(async () => {
        await sequelize.close();
        logger.info('Server and database connection closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app;
