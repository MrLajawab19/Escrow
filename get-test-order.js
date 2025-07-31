const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

async function getTestOrder() {
  try {
    // Connect to PostgreSQL
    const sequelize = new Sequelize(config.development);
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Import Order model
    const Order = require('./models/order')(sequelize, Sequelize.DataTypes);
    
    // Get the most recent order
    const orders = await Order.findAll({
      order: [['createdAt', 'DESC']],
      limit: 1
    });
    
    if (orders.length > 0) {
      const order = orders[0];
      console.log('✅ Test order found:');
      console.log('Order ID:', order.id);
      console.log('Buyer ID:', order.buyerId);
      console.log('Seller ID:', order.sellerId);
      console.log('Status:', order.status);
      console.log('Buyer Name:', order.buyerName);
      console.log('Product:', order.scopeBox.productType);
      
      // Store these IDs for frontend testing
      console.log('\n📝 For frontend testing, use these values:');
      console.log('Order ID for dispute testing:', order.id);
      console.log('Buyer ID for testing:', order.buyerId);
      console.log('Seller ID for testing:', order.sellerId);
    } else {
      console.log('❌ No orders found in database');
    }
    
    // Close connection
    await sequelize.close();
    console.log('\n✅ Database connection closed.');
    
  } catch (error) {
    console.error('❌ Failed to get test order:', error);
    process.exit(1);
  }
}

getTestOrder(); 