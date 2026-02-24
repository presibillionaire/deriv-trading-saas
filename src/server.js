const express = require('express');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/sequelize');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to PostgreSQL
connectDB().then(() => {
  logger.info('✅ All models synchronized with database');
}).catch(err => {
  logger.error(`Database sync error: ${err.message}`);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/deriv', require('./routes/deriv'));
app.use('/api/trading', require('./routes/trading'));
app.use('/api/bot', require('./routes/bot'));
app.use('/api/tokens', require('./routes/tokens'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Deriv Trading SaaS Backend is running!' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

try {
  const server = app.listen(PORT, () => {
    logger.info(`✅ Server running on http://localhost:${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
} catch (error) {
  logger.error(`Failed to start server: ${error.message}`);
  process.exit(1);
}

module.exports = app;
