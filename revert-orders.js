const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

// Initialize Sequelize
const sequelize = new Sequelize(config.development);
const Order = require('./models/order')(sequelize, Sequelize.DataTypes);
const Buyer = require('./models/buyer')(sequelize, Sequelize.DataTypes);
const Seller = require('./models/seller')(sequelize, Sequelize.DataTypes);

async function revertOrders() {
  try {
    console.log('🔄 Starting order reversion...');

    // Find existing users
    const existingBuyer = await Buyer.findOne({ where: { email: 'buyer@example.com' } });
    const existingSeller = await Seller.findOne({ where: { email: 'seller@example.com' } });

    if (!existingBuyer || !existingSeller) {
      console.log('❌ Required users not found');
      return;
    }

    // Get all orders for these users
    const orders = await Order.findAll({
      where: { buyerId: existingBuyer.id },
      order: [['createdAt', 'ASC']]
    });

    if (orders.length === 0) {
      console.log('❌ No orders found to revert');
      return;
    }

    console.log(`📋 Found ${orders.length} orders to revert`);

    // Define original statuses for each order
    const originalStatuses = [
      'PLACED',           // Order 1: Professional Logo Design
      'ESCROW_FUNDED',    // Order 2: E-commerce Website Development  
      'IN_PROGRESS',      // Order 3: Mobile App Development
      'SUBMITTED'         // Order 4: Product Marketing Video
    ];

    // Revert each order to its original status
    for (let i = 0; i < orders.length && i < originalStatuses.length; i++) {
      const order = orders[i];
      const originalStatus = originalStatuses[i];
      
      // Reset order to original status
      await Order.update(
        {
          status: originalStatus,
          deliveryFiles: originalStatus === 'SUBMITTED' ? [
            'final_video_4k.mp4',
            'video_project_file.prproj',
            'voiceover_audio.wav',
            'delivery_notes.txt'
          ] : [],
          // Reset order logs to original state
          orderLogs: getOriginalOrderLogs(order, originalStatus, existingBuyer, existingSeller)
        },
        {
          where: { id: order.id }
        }
      );

      console.log(`✅ Reverted: ${order.scopeBox.title} → ${originalStatus}`);
    }

    // Show final status
    console.log('\n📋 Final order statuses:');
    const finalOrders = await Order.findAll({
      where: { buyerId: existingBuyer.id },
      order: [['createdAt', 'ASC']]
    });

    finalOrders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.scopeBox.title}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Price: ${order.currency} ${order.scopeBox.price}`);
      console.log(`   Platform: ${order.platform}`);
      console.log('');
    });

    console.log('🎉 Order reversion completed!');
    console.log('\n🧪 Orders are now ready for testing again:');
    console.log('- Order 1: PLACED (test "Fund Escrow")');
    console.log('- Order 2: ESCROW_FUNDED (test "Accept/Reject/Request Changes")');
    console.log('- Order 3: IN_PROGRESS (test "Submit Delivery")');
    console.log('- Order 4: SUBMITTED (test "Approve/Dispute")');

  } catch (error) {
    console.error('❌ Error reverting orders:', error);
  } finally {
    await sequelize.close();
  }
}

function getOriginalOrderLogs(order, status, buyer, seller) {
  const baseLogs = [
    {
      event: 'ORDER_CREATED',
      byUserId: buyer.id,
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      buyerName: `${buyer.firstName} ${buyer.lastName}`,
      platform: order.platform,
      productType: order.scopeBox.productType,
      price: `${order.currency} ${order.scopeBox.price}`
    }
  ];

  switch (status) {
    case 'PLACED':
      return baseLogs;

    case 'ESCROW_FUNDED':
      return [
        ...baseLogs,
        {
          event: 'ESCROW_FUNDED',
          byUserId: buyer.id,
          timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          event: 'ESCROW_FUNDED'
        }
      ];

    case 'IN_PROGRESS':
      return [
        ...baseLogs,
        {
          event: 'ESCROW_FUNDED',
          byUserId: buyer.id,
          timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          event: 'ESCROW_FUNDED'
        },
        {
          event: 'ORDER_ACCEPTED',
          byUserId: seller.id,
          timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          reason: 'Accepted by seller'
        },
        {
          event: 'WORK_STARTED',
          byUserId: seller.id,
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          event: 'WORK_STARTED'
        }
      ];

    case 'SUBMITTED':
      return [
        ...baseLogs,
        {
          event: 'ESCROW_FUNDED',
          byUserId: buyer.id,
          timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          event: 'ESCROW_FUNDED'
        },
        {
          event: 'ORDER_ACCEPTED',
          byUserId: seller.id,
          timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          reason: 'Accepted by seller'
        },
        {
          event: 'WORK_STARTED',
          byUserId: seller.id,
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          event: 'WORK_STARTED'
        },
        {
          event: 'DELIVERY_SUBMITTED',
          byUserId: seller.id,
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          event: 'DELIVERY_SUBMITTED',
          deliveryFiles: [
            'final_video_4k.mp4',
            'video_project_file.prproj',
            'voiceover_audio.wav',
            'delivery_notes.txt'
          ]
        }
      ];

    default:
      return baseLogs;
  }
}

// Run the script
revertOrders(); 