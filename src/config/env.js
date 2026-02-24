module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/deriv-trading',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  DERIV_API_URL: process.env.DERIV_API_URL || 'wss://ws.binaryws.com/websockets/v3',
  DERIV_APP_ID: process.env.DERIV_APP_ID || 'YOUR_APP_ID',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};
