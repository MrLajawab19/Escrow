const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
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

async function revertMockOrders() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Load models
    const Order = require('./models/order')(sequelize, Sequelize.DataTypes);
    const Buyer = require('./models/buyer')(sequelize, Sequelize.DataTypes);
    const Seller = require('./models/seller')(sequelize, Sequelize.DataTypes);

    // Ensure tables exist
    await sequelize.sync();

    // Find or create test users (same as create-mock-orders.js)
    let buyer = await Buyer.findOne({ where: { email: 'buyer@example.com' } });
    let seller = await Seller.findOne({ where: { email: 'seller@example.com' } });

    // Create test buyer if doesn't exist
    if (!buyer) {
      console.log('🔄 Creating test buyer...');
      const hashedPassword = await bcrypt.hash('password', 10);
      buyer = await Buyer.create({
        id: uuidv4(),
        email: 'buyer@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1 (555) 123-4567',
        country: 'US',
        isVerified: true,
        status: 'active'
      });
      console.log('✅ Test buyer created: buyer@example.com (password: password)');
    } else {
      console.log('✅ Test buyer found: buyer@example.com');
    }

    // Create test seller if doesn't exist
    if (!seller) {
      console.log('🔄 Creating test seller...');
      const hashedPassword = await bcrypt.hash('password', 10);
      seller = await Seller.create({
        id: uuidv4(),
        email: 'seller@example.com',
        password: hashedPassword,
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
      console.log('✅ Test seller created: seller@example.com (password: password)');
    } else {
      console.log('✅ Test seller found: seller@example.com');
    }

    // Get test user orders only
    const testOrders = await Order.findAll({
      where: {
        buyerId: buyer.id,
        sellerId: seller.id
      }
    });

    console.log(`📊 Found ${testOrders.length} test orders for revert`);

    if (testOrders.length === 0) {
      console.log('❌ No test orders found to revert. Run create-mock-orders.js first.');
      return;
    }

    console.log('\n🔄 Reverting orders to original test states...');

    // Define the original test order states that match create-mock-orders.js
    const originalOrderStates = [
      {
        status: 'PLACED',
        scopeBox: {
          title: 'Professional Logo Design',
          productType: 'Design',
          productLink: 'https://example.com/logo-design',
          description: 'Create a modern, professional logo for tech startup. Need vector files and brand guidelines.',
          condition: 'Deliver AI, EPS, PNG, and SVG files with brand guidelines PDF',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          price: 250,
          deliverables: ['Logo in vector format', 'Brand guidelines', 'Color variations']
        },
        deliveryFiles: []
      },
      {
        status: 'ESCROW_FUNDED',
        scopeBox: {
          title: 'Website Landing Page',
          productType: 'Web Development',
          productLink: 'https://example.com/landing-page',
          description: 'Responsive landing page for SaaS product with modern design and conversion optimization.',
          condition: 'Mobile-responsive, cross-browser compatible, with contact form integration',
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          price: 500,
          deliverables: ['HTML/CSS/JS files', 'Responsive design', 'Contact form', 'Documentation']
        },
        deliveryFiles: []
      },
      {
        status: 'IN_PROGRESS',
        scopeBox: {
          title: 'Social Media Content Package',
          productType: 'Content Creation',
          productLink: 'https://example.com/social-media',
          description: '10 Instagram posts with captions for fitness brand. High-quality graphics with brand consistency.',
          condition: 'Instagram-optimized dimensions, brand colors, engaging captions included',
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          price: 150,
          deliverables: ['10 Instagram posts', 'Captions', 'Hashtag suggestions', 'Brand guidelines']
        },
        deliveryFiles: []
      },
      {
        status: 'SUBMITTED',
        scopeBox: {
          title: 'Product Video Advertisement',
          productType: 'Video Production',
          productLink: 'https://example.com/video-ad',
          description: '30-second promotional video for e-commerce product with professional voiceover and animations.',
          condition: 'HD quality, with background music, professional voiceover, and call-to-action',
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          price: 400,
          deliverables: ['30-second video', 'Multiple formats', 'Source files', 'Thumbnail images']
        },
        deliveryFiles: ['product-video-final.mp4', 'video-thumbnails.zip', 'source-files.zip']
      }
    ];

    // Revert each order to its original state
    for (let i = 0; i < testOrders.length && i < originalOrderStates.length; i++) {
      const order = testOrders[i];
      const originalState = originalOrderStates[i];
      
      // Update order to original state
      await order.update({
        status: originalState.status,
        scopeBox: originalState.scopeBox,
        deliveryFiles: originalState.deliveryFiles,
        orderLogs: [], // Clear any accumulated logs
        updatedAt: new Date()
      });

      console.log(`✅ Order reverted: ${originalState.scopeBox.title} (${originalState.status})`);
    }

    // Handle any extra orders beyond the 4 standard test orders
    if (testOrders.length > 4) {
      for (let i = 4; i < testOrders.length; i++) {
        const order = testOrders[i];
        await order.update({
          status: 'PLACED',
          deliveryFiles: [],
          orderLogs: [],
          updatedAt: new Date()
        });
        console.log(`✅ Extra order ${i + 1} reverted to PLACED status`);
      }
    }

    console.log('\n🎯 Test orders have been reverted to original states:');
    console.log('  1. PLACED - Test "Fund Escrow" button (Buyer)');
    console.log('  2. ESCROW_FUNDED - Test "Accept Order" button (Seller)');
    console.log('  3. IN_PROGRESS - Test "Submit Delivery" button (Seller)');
    console.log('  4. SUBMITTED - Test "Release Funds" and "Raise Dispute" buttons (Buyer)');
    
    console.log('\n🚀 All action buttons are ready for testing!');
    console.log('💡 Run create-mock-orders.js to recreate fresh test data if needed.');

  } catch (error) {
    console.error('❌ Error reverting mock orders:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
revertMockOrders();
