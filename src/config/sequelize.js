const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/deriv-trading',
  {
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL Connected via Sequelize');
    
    // Sync models with database
    await sequelize.sync({ alter: true });
    logger.info('✅ Database models synchronized');
    
    return sequelize;
  } catch (error) {
    logger.error(`❌ Database connection failed: ${error.message}`);
    logger.error(`Full error: ${JSON.stringify(error)}`);
    // Don't exit - continue without database
    return null;
  }
};

module.exports = { sequelize, connectDB };
