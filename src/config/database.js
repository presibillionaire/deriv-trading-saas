const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use DATABASE_URL if it exists (Supabase), otherwise use local params
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false // Required for Supabase/Cloud providers
        }
      },
      logging: false
    })
  : new Sequelize(
      process.env.DB_NAME || 'deriv_saas',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || '127.0.0.1',
        dialect: 'postgres',
        logging: false,
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
      }
    );

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database Connected Successfully');
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
