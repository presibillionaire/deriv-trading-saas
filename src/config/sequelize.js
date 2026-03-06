const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
require('dotenv').config(); // Ensure dotenv is loaded!

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    // THIS IS REQUIRED FOR SUPABASE/AWS
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Connected to Supabase/AWS PostgreSQL');
    
    // Use force: true ONCE to ensure the 'username' column is created on Supabase
    await sequelize.sync({ alter: true }); 
    logger.info('✅ Database models synchronized');
    
    return sequelize;
  } catch (error) {
    logger.error(`❌ Database connection failed: ${error.message}`);
    return null;
  }
};

module.exports = { sequelize, connectDB };
