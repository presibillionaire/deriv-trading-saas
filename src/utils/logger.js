/**
 * Winston Logger Configuration
 */

const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'deriv-trading-saas' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(process.env.LOG_FILE_PATH || './logs', 'error.log'),
      level: 'error'
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(process.env.LOG_FILE_PATH || './logs', 'combined.log')
    }),
    // Console logs (development)
    ...(process.env.NODE_ENV !== 'production'
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          })
        ]
      : [])
  ]
});

module.exports = logger;
