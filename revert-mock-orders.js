const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

// Initialize Sequelize with development config
const sequelize = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  {
    host: config.development.host,
    dialect: config.development.dialect,
    logging: false
  }
);

// Import models
const Order = require('./models/order');
const Buyer = require('./models/buyer');
const Seller = require('./models/seller');

async function revertMockOrders() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Get all existing orders
    const existingOrders = await Order.findAll();
    console.log(`📊 Found ${existingOrders.length} existing orders`);

    if (existingOrders.length === 0) {
      console.log('❌ No orders found to revert');
      return;
    }

    // Get buyer and seller for reference
    const buyer = await Buyer.findOne({ where: { email: 'buyer@example.com' } });
    const seller = await Seller.findOne({ where: { email: 'seller@example.com' } });

    if (!buyer || !seller) {
      console.log('❌ Test buyer or seller not found. Please run setup-auth-database.js first');
      return;
    }

    console.log('\n🔄 Reverting orders to original test states...');

    // Revert each order to its original state
    for (let i = 0; i < existingOrders.length; i++) {
      const order = existingOrders[i];
      
      // Define original states for testing different action buttons
      let originalStatus;
      let originalDescription;
      
      switch (i) {
        case 0:
          // Order 1: ESCROW_FUNDED - Test "Start Work" button
          originalStatus = 'ESCROW_FUNDED';
          originalDescription = 'Professional Logo Design - Ready for seller to start work';
          break;
        case 1:
          // Order 2: PLACED - Test "Fund Escrow" button
          originalStatus = 'PLACED';
          originalDescription = 'Poster/Flyer Design - Waiting for buyer to fund escrow';
          break;
        case 2:
          // Order 3: SUBMITTED - Test "Raise Dispute" button
          originalStatus = 'SUBMITTED';
          originalDescription = 'Social Media Post Creation - Ready for buyer review, can raise dispute';
          break;
        case 3:
          // Order 4: IN_PROGRESS - Test "Submit Delivery" button
          originalStatus = 'IN_PROGRESS';
          originalDescription = 'Video Editing - Seller is working, can submit delivery when ready';
          break;
        default:
          // Any additional orders get ESCROW_FUNDED status
          originalStatus = 'ESCROW_FUNDED';
          originalDescription = 'Additional Test Order - Ready for testing';
      }

      // Update order to original state
      await order.update({
        status: originalStatus,
        description: originalDescription,
        updatedAt: new Date()
      });

      console.log(`✅ Order ${order.id} reverted to ${originalStatus}`);
    }

    console.log('\n🎯 Mock orders have been reverted to their original test states:');
    console.log('📋 Order 1: ESCROW_FUNDED - Test "Start Work" button');
    console.log('📋 Order 2: PLACED - Test "Fund Escrow" button');
    console.log('📋 Order 3: SUBMITTED - Test "Raise Dispute" button');
    console.log('📋 Order 4: IN_PROGRESS - Test "Submit Delivery" button');
    
    console.log('\n🚀 You can now test all action buttons again!');
    console.log('💡 Run this script anytime you want to reset the orders for testing');

  } catch (error) {
    console.error('❌ Error reverting mock orders:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
revertMockOrders();
