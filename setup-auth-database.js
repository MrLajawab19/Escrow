const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const config = require('./config/config.json');

async function setupAuthDatabase() {
  try {
    // Connect to PostgreSQL
    const sequelize = new Sequelize(config.development);
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Import models
    const Buyer = require('./models/buyer')(sequelize, Sequelize.DataTypes);
    const Seller = require('./models/seller')(sequelize, Sequelize.DataTypes);
    
    // Sync all models
    await sequelize.sync({ force: true });
    console.log('✅ Authentication tables created successfully.');
    
    // Create a test buyer account
    const testBuyer = await Buyer.create({
      id: uuidv4(),
      email: 'buyer@example.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1 (555) 123-4567',
      country: 'US',
      isVerified: true,
      status: 'active'
    });
    
    console.log('✅ Test buyer account created:');
    console.log('Email: buyer@example.com');
    console.log('Password: password');
    console.log('ID:', testBuyer.id);
    
    // Create a test seller account
    const testSeller = await Seller.create({
      id: uuidv4(),
      email: 'seller@example.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1 (555) 987-6543',
      country: 'US',
      businessName: 'Jane\'s Design Studio',
      isVerified: true,
      status: 'active',
      skills: ['Logo Design', 'Web Design', 'Branding'],
      rating: 4.8,
      totalOrders: 25,
      completedOrders: 23
    });
    
    console.log('✅ Test seller account created:');
    console.log('Email: seller@example.com');
    console.log('Password: password');
    console.log('ID:', testSeller.id);
    
    // Close connection
    await sequelize.close();
    console.log('✅ Authentication database setup completed.');
    
  } catch (error) {
    console.error('❌ Authentication database setup failed:', error);
    process.exit(1);
  }
}

setupAuthDatabase(); 