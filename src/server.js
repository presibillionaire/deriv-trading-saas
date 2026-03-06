const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
// Ensure this path matches where your connectDB function lives
const { connectDB } = require('./config/sequelize'); 

dotenv.config();

// Initialize Express
const app = express();

// Connect to PostgreSQL (Sequelize)
connectDB(); 

// --- IMPORT ROUTES ---
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const derivRoutes = require('./routes/derivRoutes'); // NEW: Added Deriv Routes
const tradeRoutes = require('./routes/tradeRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// --- MIDDLEWARE ---
app.use(express.json());
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
};
app.use(cors(corsOptions));

// --- HEALTH CHECK ---
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: '🚀 Deriv Trading SaaS API is online',
    timestamp: new Date().toISOString()
  });
});

// --- ROUTE MIDDLEWARES ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/deriv', derivRoutes); // NEW: Endpoint for Deriv connections
app.use('/api/trades', tradeRoutes);
app.use('/api/analytics', analyticsRoutes);

// --- ERROR HANDLING ---
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} {"service":"deriv-trading-saas"}`);
});
