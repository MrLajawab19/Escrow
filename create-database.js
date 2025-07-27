const { Sequelize } = require('sequelize');

async function createDatabase() {
  try {
    // Connect to PostgreSQL without specifying a database
    const sequelize = new Sequelize({
      username: 'postgres',
      password: 'ayush19$',
      host: '127.0.0.1',
      dialect: 'postgres',
      logging: false
    });
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully.');
    
    // Create database
    await sequelize.query('CREATE DATABASE escrowx_dev;');
    console.log('✅ Database "escrowx_dev" created successfully.');
    
    // Create test database
    await sequelize.query('CREATE DATABASE escrowx_test;');
    console.log('✅ Database "escrowx_test" created successfully.');
    
    // Create production database
    await sequelize.query('CREATE DATABASE escrowx_prod;');
    console.log('✅ Database "escrowx_prod" created successfully.');
    
    // Close connection
    await sequelize.close();
    console.log('✅ Database creation completed.');
    
  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
    
    // If database already exists, that's fine
    if (error.message.includes('already exists')) {
      console.log('✅ Databases already exist, proceeding...');
    } else {
      process.exit(1);
    }
  }
}

createDatabase(); 