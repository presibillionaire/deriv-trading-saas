const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'postgres', // or mysql, sqlite, etc.
});

module.exports = sequelize; // export the instance directly
