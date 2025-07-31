const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

async function setupDatabase() {
  try {
    // Connect to PostgreSQL
    const sequelize = new Sequelize(config.development);
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Import all models explicitly
    const Order = require('./models/order')(sequelize, Sequelize.DataTypes);
    const Buyer = require('./models/buyer')(sequelize, Sequelize.DataTypes);
    const Seller = require('./models/seller')(sequelize, Sequelize.DataTypes);
    
    console.log('✅ Models loaded successfully.');
    
    // Drop all tables and recreate them
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created successfully.');
    
    // Close connection
    await sequelize.close();
    console.log('✅ Database setup completed.');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase(); 