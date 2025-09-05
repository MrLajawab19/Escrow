const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
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

    // Find or create demo users
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

    // Check if mock orders already exist to avoid duplicates
    const existingOrders = await Order.findAll({
      where: {
        buyerId: buyer.id,
        sellerId: seller.id
      }
    });

    if (existingOrders.length >= 4) {
      console.log(`✅ Found ${existingOrders.length} existing mock orders. Skipping creation.`);
      console.log('💡 Run revert-mock-orders.js first if you want to recreate them.');
      return;
    }

    // Delete existing orders to recreate fresh test data
    if (existingOrders.length > 0) {
      await Order.destroy({
        where: {
          buyerId: buyer.id,
          sellerId: seller.id
        }
      });
      console.log(`🗑️ Removed ${existingOrders.length} existing orders to create fresh test data`);
    }

    const common = {
      buyerId: buyer.id,
      sellerId: seller.id,
      buyerName: `${buyer.firstName} ${buyer.lastName}`,
      buyerEmail: buyer.email,
      platform: 'ScrowX',
      productLink: 'https://example.com/item/123',
      country: 'US',
      currency: 'USD',
      sellerContact: seller.email,
      escrowLink: 'https://scrowx.local/escrow/abc123',
      orderTrackingLink: 'https://scrowx.local/track/abc123',
      deliveryFiles: [],
      orderLogs: [],
    };

    // Create 4 comprehensive test orders to test all action buttons
    const ordersData = [
      {
        id: uuidv4(),
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
        }
      },
      {
        id: uuidv4(),
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
        }
      },
      {
        id: uuidv4(),
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
        }
      },
      {
        id: uuidv4(),
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

    const created = [];
    for (const orderData of ordersData) {
      const order = await Order.create({ ...common, ...orderData });
      created.push(order.id);
      console.log(`✅ Created order: ${orderData.scopeBox.title} (${orderData.status})`);
    }

    console.log('\n🎉 Mock orders created successfully!');
    console.log('📊 Test Orders Summary:');
    console.log('  1. PLACED - Test "Fund Escrow" button (Buyer)');
    console.log('  2. ESCROW_FUNDED - Test "Accept Order" button (Seller)');
    console.log('  3. IN_PROGRESS - Test "Submit Delivery" button (Seller)');
    console.log('  4. SUBMITTED - Test "Release Funds" and "Raise Dispute" buttons (Buyer)');
    console.log('\n🚀 You can now test all action buttons in buyer/seller dashboards!');
    console.log('💡 Use revert-mock-orders.js to reset orders for repeated testing.');
  } catch (err) {
    console.error('❌ Failed to create mock orders:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

createMockOrders();
