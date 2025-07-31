const { Sequelize } = require('sequelize');
const config = require('./config/config.json');
const { v4: uuidv4 } = require('uuid');

async function createTestOrder() {
  try {
    // Connect to PostgreSQL
    const sequelize = new Sequelize(config.development);
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Import Order model
    const Order = require('./models/order')(sequelize, Sequelize.DataTypes);
    
    // Create a test order
    const testOrder = await Order.create({
      id: uuidv4(),
      buyerId: uuidv4(),
      sellerId: uuidv4(),
      buyerName: 'John Doe',
      platform: 'Fiverr',
      productLink: 'https://fiverr.com/test-product',
      country: 'India',
      currency: 'USD',
      sellerContact: 'seller@example.com',
      escrowLink: 'https://escrowx.com/test-escrow',
      scopeBox: {
        productType: 'Logo Design',
        productLink: 'https://fiverr.com/test-product',
        description: 'Create a modern logo for my tech startup',
        condition: 'Must be vector format with source files',
        price: 500,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        deliverables: ['Logo in vector format', 'Source files', '3 variations']
      },
      status: 'SUBMITTED',
      deliveryFiles: ['logo_final.ai', 'logo_variations.zip'],
      orderLogs: [
        {
          event: 'ORDER_CREATED',
          timestamp: new Date().toISOString(),
          byUserId: 'buyer-123'
        },
        {
          event: 'ESCROW_FUNDED',
          timestamp: new Date().toISOString(),
          byUserId: 'buyer-123'
        },
        {
          event: 'WORK_STARTED',
          timestamp: new Date().toISOString(),
          byUserId: 'seller-456'
        },
        {
          event: 'DELIVERY_SUBMITTED',
          timestamp: new Date().toISOString(),
          byUserId: 'seller-456',
          deliveryFiles: ['logo_final.ai', 'logo_variations.zip']
        }
      ]
    });
    
    console.log('✅ Test order created successfully:');
    console.log('Order ID:', testOrder.id);
    console.log('Status:', testOrder.status);
    console.log('Buyer:', testOrder.buyerName);
    console.log('Product:', testOrder.scopeBox.productType);
    
    // Close connection
    await sequelize.close();
    console.log('✅ Database connection closed.');
    
  } catch (error) {
    console.error('❌ Failed to create test order:', error);
    process.exit(1);
  }
}

createTestOrder(); 