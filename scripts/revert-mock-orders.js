const { Sequelize } = require('sequelize');
const config = require('../config/config.json');

async function revertMockOrders() {
  const sequelize = new Sequelize(
    config.development.database,
    config.development.username,
    config.development.password,
    {
      host: config.development.host,
      dialect: config.development.dialect,
      logging: false,
    }
  );

  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const Order = require('../models/order')(sequelize, Sequelize.DataTypes);
    const Buyer = require('../models/buyer')(sequelize, Sequelize.DataTypes);
    const Seller = require('../models/seller')(sequelize, Sequelize.DataTypes);

    // Ensure the table metadata is available
    await sequelize.sync();

    const buyer = await Buyer.findOne({ where: { email: 'buyer@example.com' } });
    const seller = await Seller.findOne({ where: { email: 'seller@example.com' } });

    if (!buyer || !seller) {
      console.log('❌ Demo users not found. Run setup-auth-database.js first.');
      process.exit(1);
    }

    const orders = await Order.findAll({
      where: { buyerId: buyer.id },
      order: [['createdAt', 'ASC']],
    });

    if (orders.length === 0) {
      console.log('ℹ️ No orders found to revert. Create mock orders first.');
      return;
    }

    const targetStates = [
      { status: 'ESCROW_FUNDED', description: 'Logo Design - Ready to start' },
      { status: 'PLACED', description: 'Poster/Flyer Design - Awaiting escrow funding' },
      { status: 'SUBMITTED', description: 'Social Media Post - Submitted for review' },
      { status: 'IN_PROGRESS', description: 'Video Editing - Work in progress' },
    ];

    let index = 0;
    for (const order of orders) {
      const state = targetStates[index] || { status: 'ESCROW_FUNDED', description: 'Additional Test Order - Ready for testing' };
      await order.update({ status: state.status, description: state.description, updatedAt: new Date() });
      console.log(`✅ Order ${order.id} → ${state.status}`);
      index += 1;
    }

    console.log('\n🎯 Orders reverted to original test states.');
  } catch (err) {
    console.error('❌ Error reverting mock orders:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

revertMockOrders();


