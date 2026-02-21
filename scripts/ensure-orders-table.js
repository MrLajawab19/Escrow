/**
 * Creates the orders table without dropping existing data.
 * Run after setup-auth-database if you get "Failed to load orders".
 * Usage: node scripts/ensure-orders-table.js
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('../config/config.json').development;

async function run() {
  const sequelize = new Sequelize(config);
  try {
    await sequelize.authenticate();
    const Order = require('../models/order')(sequelize, Sequelize.DataTypes);
    await Order.sync();
    console.log('✅ Orders table ready.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
