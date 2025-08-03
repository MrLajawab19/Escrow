const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

const sequelize = new Sequelize(config.development);

async function revertMockOrders() {
  try {
    console.log('🔄 Reverting mock orders to original states...\n');
    
    // Get all orders
    const [orders] = await sequelize.query(`
      SELECT id, "scopeBox"->>'title' as title, status, "orderLogs"
      FROM orders 
      ORDER BY "createdAt" DESC
    `);
    
    console.log('📋 Current Orders:');
    orders.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.title} - Status: ${order.status}`);
    });
    
    // Define the original states for each mock order
    const originalStates = [
      {
        title: 'Modern Logo Design',
        status: 'ESCROW_FUNDED',
        description: 'Ready for seller action (Accept/Reject/Request Changes)'
      },
      {
        title: 'E-commerce Website',
        status: 'SUBMITTED',
        description: 'Ready for buyer to release funds'
      },
      {
        title: 'Blog Content Writing',
        status: 'DISPUTED',
        description: 'Has an active dispute'
      },
      {
        title: 'Social Media Graphics',
        status: 'IN_PROGRESS',
        description: 'Seller is working on the project'
      }
    ];
    
    console.log('\n🔄 Reverting orders to original states...');
    
    // Update each order to its original state based on title
    for (const order of orders) {
      const originalState = originalStates.find(state => state.title === order.title);
      
      if (originalState) {
        // Update the order status
        await sequelize.query(`
          UPDATE orders 
          SET status = $1, "updatedAt" = NOW()
          WHERE id = $2
        `, {
          bind: [originalState.status, order.id]
        });
        
        console.log(`✅ ${order.title} → ${originalState.status} (${originalState.description})`);
      }
    }
    
    // Clear any disputes that might have been created
    await sequelize.query('DELETE FROM disputes WHERE id::text LIKE $1', {
      bind: ['mock-dispute-%']
    });
    console.log('✅ Cleared any test disputes');
    
    // Verify the revert
    const [updatedOrders] = await sequelize.query(`
      SELECT id, "scopeBox"->>'title' as title, status
      FROM orders 
      ORDER BY "createdAt" DESC
    `);
    
    console.log('\n📋 Reverted Orders:');
    updatedOrders.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.title} - Status: ${order.status}`);
    });
    
    console.log('\n🎉 Mock orders reverted successfully!');
    console.log('\n📋 Available Actions for Testing:');
    console.log('• ESCROW_FUNDED: Test Accept/Reject/Request Changes (seller)');
    console.log('• SUBMITTED: Test Release Funds (buyer)');
    console.log('• DISPUTED: Test dispute resolution (admin)');
    console.log('• IN_PROGRESS: Test Order Delivered (seller)');
    
  } catch (error) {
    console.error('❌ Error reverting mock orders:', error);
  } finally {
    await sequelize.close();
  }
}

revertMockOrders(); 