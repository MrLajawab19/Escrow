const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const config = require('./config/config.json');

async function createMockOrders() {
  try {
    // Connect to PostgreSQL
    const sequelize = new Sequelize(config.development);
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Import models
    const Order = require('./models/order')(sequelize, Sequelize.DataTypes);
    const Buyer = require('./models/buyer')(sequelize, Sequelize.DataTypes);
    const Seller = require('./models/seller')(sequelize, Sequelize.DataTypes);
    
    // Get existing buyer and seller
    const buyer = await Buyer.findOne({ where: { email: 'buyer@example.com' } });
    const seller = await Seller.findOne({ where: { email: 'seller@example.com' } });
    
    if (!buyer || !seller) {
      console.log('❌ Buyer or seller not found. Please run setup-auth-database.js first.');
      return;
    }
    
    console.log('✅ Found buyer and seller accounts.');
    
    // Create mock orders in different statuses to test all action buttons
    const mockOrders = [
      {
        id: uuidv4(),
        buyerId: buyer.id,
        sellerId: seller.id,
        buyerName: buyer.firstName + ' ' + buyer.lastName,
        buyerEmail: buyer.email,
        platform: 'Fiverr',
        productLink: 'https://fiverr.com/seller/logo-design',
        country: 'US',
        currency: 'USD',
        sellerContact: seller.email,
        escrowLink: `http://localhost:5173/seller/order/${uuidv4()}`,
        orderTrackingLink: `http://localhost:5173/buyer/order/${uuidv4()}`,
        xBox: {
          title: 'Professional Logo Design',
          productType: 'Logo design',
          productLink: 'https://fiverr.com/seller/logo-design',
          description: 'Need a modern, minimalist logo for my tech startup',
          condition: 'New',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          price: '150.00'
        },
        status: 'ESCROW_FUNDED', // Buyer can: Cancel Order
        escrowAmount: 150.00,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(),
        orderLogs: [
          {
            event: 'ORDER_PLACED',
            byUserId: buyer.id,
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            previousStatus: null,
            newStatus: 'PLACED',
            reason: 'Order created by buyer'
          },
          {
            event: 'ESCROW_FUNDED',
            byUserId: buyer.id,
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            previousStatus: 'PLACED',
            newStatus: 'ESCROW_FUNDED',
            reason: 'Payment received and held in escrow'
          }
        ]
      },
      {
        id: uuidv4(),
        buyerId: buyer.id,
        sellerId: seller.id,
        buyerName: buyer.firstName + ' ' + buyer.lastName,
        buyerEmail: buyer.email,
        platform: 'Upwork',
        productLink: 'https://upwork.com/seller/web-design',
        country: 'US',
        currency: 'USD',
        sellerContact: seller.email,
        escrowLink: `http://localhost:5173/seller/order/${uuidv4()}`,
        orderTrackingLink: `http://localhost:5173/buyer/order/${uuidv4()}`,
        xBox: {
          title: 'E-commerce Website Design',
          productType: 'Website development',
          productLink: 'https://upwork.com/seller/web-design',
          description: 'Full e-commerce website with payment integration',
          condition: 'New',
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
          price: '500.00'
        },
        status: 'PLACED', // Buyer can: Cancel Order, Seller can: Accept/Reject
        escrowAmount: 0.00,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(),
        orderLogs: [
          {
            event: 'ORDER_PLACED',
            byUserId: buyer.id,
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            previousStatus: null,
            newStatus: 'PLACED',
            reason: 'Order created by buyer'
          }
        ]
      },
      {
        id: uuidv4(),
        buyerId: buyer.id,
        sellerId: seller.id,
        buyerName: buyer.firstName + ' ' + buyer.lastName,
        buyerEmail: buyer.email,
        platform: 'Freelancer',
        productLink: 'https://freelancer.com/seller/social-media',
        country: 'US',
        currency: 'USD',
        sellerContact: seller.email,
        escrowLink: `http://localhost:5173/seller/order/${uuidv4()}`,
        orderTrackingLink: `http://localhost:5173/buyer/order/${uuidv4()}`,
        xBox: {
          title: 'Social Media Marketing Campaign',
          productType: 'Social media marketing',
          productLink: 'https://freelancer.com/seller/social-media',
          description: '30-day social media campaign for Instagram and Facebook',
          condition: 'New',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          price: '300.00'
        },
        status: 'SUBMITTED', // Buyer can: Approve Delivery, Raise Dispute, Request Changes
        escrowAmount: 300.00,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        updatedAt: new Date(),
        deliveryFiles: ['campaign-strategy.pdf', 'content-calendar.xlsx', 'design-mockups.zip'],
        orderLogs: [
          {
            event: 'ORDER_PLACED',
            byUserId: buyer.id,
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            previousStatus: null,
            newStatus: 'PLACED',
            reason: 'Order created by buyer'
          },
          {
            event: 'ESCROW_FUNDED',
            byUserId: buyer.id,
            timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
            previousStatus: 'PLACED',
            newStatus: 'ESCROW_FUNDED',
            reason: 'Payment received and held in escrow'
          },
          {
            event: 'ORDER_ACCEPTED',
            byUserId: seller.id,
            timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            previousStatus: 'ESCROW_FUNDED',
            newStatus: 'ACCEPTED',
            reason: 'Seller accepted the order and started work'
          },
          {
            event: 'WORK_STARTED',
            byUserId: seller.id,
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            previousStatus: 'ACCEPTED',
            newStatus: 'IN_PROGRESS',
            reason: 'Seller began working on the social media campaign'
          },
          {
            event: 'DELIVERY_SUBMITTED',
            byUserId: seller.id,
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            previousStatus: 'IN_PROGRESS',
            newStatus: 'SUBMITTED',
            reason: 'Social media campaign strategy and content delivered'
          }
        ]
      },
      {
        id: uuidv4(),
        buyerId: buyer.id,
        sellerId: seller.id,
        buyerName: buyer.firstName + ' ' + buyer.lastName,
        buyerEmail: buyer.email,
        platform: '99designs',
        productLink: 'https://99designs.com/seller/branding',
        country: 'US',
        currency: 'USD',
        sellerContact: seller.email,
        escrowLink: `http://localhost:5173/seller/order/${uuidv4()}`,
        orderTrackingLink: `http://localhost:5173/buyer/order/${uuidv4()}`,
        scopeBox: {
          title: 'Complete Brand Identity Package',
          productType: 'Branding',
          productLink: 'https://99designs.com/seller/branding',
          description: 'Full brand identity including logo, business cards, letterhead, and brand guidelines',
          condition: 'New',
          deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
          price: '800.00'
        },
        status: 'IN_PROGRESS', // Seller can: Submit Delivery, Buyer can: Cancel Order
        escrowAmount: 800.00,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        updatedAt: new Date(),
        orderLogs: [
          {
            event: 'ORDER_PLACED',
            byUserId: buyer.id,
            timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            previousStatus: null,
            newStatus: 'PLACED',
            reason: 'Order created by buyer'
          },
          {
            event: 'ESCROW_FUNDED',
            byUserId: buyer.id,
            timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            previousStatus: 'PLACED',
            newStatus: 'ESCROW_FUNDED',
            reason: 'Payment received and held in escrow'
          },
          {
            event: 'ORDER_ACCEPTED',
            byUserId: seller.id,
            timestamp: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
            previousStatus: 'ESCROW_FUNDED',
            newStatus: 'ACCEPTED',
            reason: 'Seller accepted the order and started work'
          },
          {
            event: 'WORK_STARTED',
            byUserId: seller.id,
            timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            previousStatus: 'ACCEPTED',
            newStatus: 'IN_PROGRESS',
            reason: 'Seller began working on the brand identity package'
          }
        ]
      }
    ];
    
    // Insert mock orders
    for (const orderData of mockOrders) {
      await Order.create(orderData);
      console.log(`✅ Created order: ${orderData.xBox.title}`);
      console.log(`   Status: ${orderData.status} | Price: $${orderData.escrowAmount}`);
    }
    
    console.log('');
    console.log('🎯 Mock orders created successfully! Here\'s what you can test:');
    console.log('');
    console.log('1. 📋 ESCROW_FUNDED Order:');
    console.log('   - Buyer can: Cancel Order');
    console.log('   - Seller can: Accept/Reject Order');
    console.log('');
    console.log('2. 📝 PLACED Order:');
    console.log('   - Buyer can: Cancel Order');
    console.log('   - Seller can: Accept/Reject Order');
    console.log('');
    console.log('3. ✅ SUBMITTED Order:');
    console.log('   - Buyer can: Approve Delivery, Raise Dispute, Request Changes');
    console.log('   - Perfect for testing dispute functionality!');
    console.log('');
    console.log('4. 🔄 IN_PROGRESS Order:');
    console.log('   - Seller can: Submit Delivery');
    console.log('   - Buyer can: Cancel Order (if allowed)');
    console.log('');
    console.log('🚀 Now you can test all the action buttons on your dashboard!');
    
    // Close connection
    await sequelize.close();
    console.log('✅ Database connection closed.');
    
  } catch (error) {
    console.error('❌ Error creating mock orders:', error);
    process.exit(1);
  }
}

createMockOrders();
