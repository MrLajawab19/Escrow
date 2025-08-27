const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const config = require('./config/config.json');

async function createMockOrders() {
  // Connect using development config
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

    // Load models
    const Order = require('./models/order')(sequelize, Sequelize.DataTypes);
    const Buyer = require('./models/buyer')(sequelize, Sequelize.DataTypes);
    const Seller = require('./models/seller')(sequelize, Sequelize.DataTypes);

    // Ensure tables exist
    await sequelize.sync();

    // Find demo users
    const buyer = await Buyer.findOne({ where: { email: 'buyer@example.com' } });
    const seller = await Seller.findOne({ where: { email: 'seller@example.com' } });

    if (!buyer || !seller) {
      console.log('❌ Demo users not found. Please run setup-auth-database.js first.');
      process.exit(1);
    }

    const common = {
      buyerId: buyer.id,
      sellerId: seller.id,
      buyerName: `${buyer.firstName} ${buyer.lastName}`,
      buyerEmail: buyer.email,
      platform: 'Upwork',
      productLink: 'https://example.com/item/123',
      country: 'US',
      currency: 'USD',
      sellerContact: 'seller_contact@example.com',
      escrowLink: 'https://scrowx.local/escrow/abc123',
      orderTrackingLink: 'https://scrowx.local/track/abc123',
      scopeBox: {
        title: 'Design Work',
        productType: 'Design',
        productLink: 'https://example.com/item/123',
        description: 'Sample order for testing actions',
        condition: 'Deliver source files',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        price: 150,
      },
      deliveryFiles: [],
      orderLogs: [],
    };

    const ordersData = [
      { id: uuidv4(), status: 'ESCROW_FUNDED', description: 'Logo Design - Ready to start' },
      { id: uuidv4(), status: 'PLACED', description: 'Poster/Flyer Design - Awaiting escrow funding' },
      { id: uuidv4(), status: 'SUBMITTED', description: 'Social Media Post - Submitted for review' },
      { id: uuidv4(), status: 'IN_PROGRESS', description: 'Video Editing - Work in progress' },
    ];

    const created = [];
    for (const od of ordersData) {
      const order = await Order.create({ ...common, ...od });
      created.push(order.id);
      console.log(`✅ Created order ${order.id} (${od.status})`);
    }

    console.log('\n🎉 Mock orders created:', created.join(', '));
    console.log('You can now test buyer/seller dashboards.');
  } catch (err) {
    console.error('❌ Failed to create mock orders:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

createMockOrders();
