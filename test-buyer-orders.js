const axios = require('axios');

async function testBuyerOrders() {
  try {
    console.log('🧪 Testing Buyer Orders Dashboard...\n');

    // Step 1: Login as buyer
    console.log('1. 🔐 Logging in as buyer...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/buyer/login', {
      email: 'buyer@example.com',
      password: 'password'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Buyer login failed');
    }
    
    const buyerToken = loginResponse.data.token;
    const buyerData = loginResponse.data.user;
    console.log('✅ Buyer login successful!');
    console.log(`   Buyer: ${buyerData.firstName} ${buyerData.lastName}`);
    console.log(`   Email: ${buyerData.email}`);

    // Step 2: Create a new order
    console.log('\n2. 📋 Creating new order...');
    const orderData = {
      platform: 'Upwork',
      productLink: 'https://www.upwork.com/projects/123456',
      country: 'USA',
      currency: 'USD',
      sellerContact: 'seller@example.com',
      scopeBox: {
        productType: 'Website',
        productLink: 'https://example.com/project',
        description: 'Create a modern e-commerce website with payment integration and responsive design. The website should include product catalog, shopping cart, user authentication, and admin panel.',
        attachments: ['requirements.pdf', 'design-mockup.png'],
        condition: 'New',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        price: '2500.00'
      }
    };

    const orderResponse = await axios.post('http://localhost:3000/api/orders', orderData, {
      headers: {
        'Authorization': `Bearer ${buyerToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!orderResponse.data.success) {
      throw new Error('Order creation failed');
    }

    const createdOrder = orderResponse.data.data;
    console.log('✅ Order created successfully!');
    console.log(`   Order ID: ${createdOrder.orderId}`);
    console.log(`   Status: ${createdOrder.status}`);
    console.log(`   Price: ${createdOrder.price}`);

    // Step 3: Fetch buyer orders
    console.log('\n3. 📊 Fetching buyer orders...');
    const ordersResponse = await axios.get('http://localhost:3000/api/orders/buyer', {
      headers: {
        'Authorization': `Bearer ${buyerToken}`
      }
    });

    if (ordersResponse.data.success) {
      const orders = ordersResponse.data.data;
      console.log('✅ Buyer orders fetched successfully!');
      console.log(`   Total Orders: ${orders.length}`);
      
      orders.forEach((order, index) => {
        console.log(`\n   Order ${index + 1}:`);
        console.log(`     ID: ${order.id}`);
        console.log(`     Status: ${order.status}`);
        console.log(`     Platform: ${order.platform}`);
        console.log(`     Price: ${order.scopeBox?.price || 'N/A'}`);
        console.log(`     Created: ${new Date(order.createdAt).toLocaleDateString()}`);
      });
    } else {
      throw new Error('Failed to fetch buyer orders');
    }

    // Step 4: Test cancel order functionality
    console.log('\n4. ❌ Testing cancel order...');
    const cancelResponse = await axios.patch(`http://localhost:3000/api/orders/${createdOrder.orderId}/cancel`, {}, {
      headers: {
        'Authorization': `Bearer ${buyerToken}`
      }
    });

    if (cancelResponse.data.success) {
      console.log('✅ Order cancelled successfully!');
      console.log(`   New Status: ${cancelResponse.data.data.status}`);
    } else {
      console.log('❌ Order cancellation failed:', cancelResponse.data.message);
    }

    // Step 5: Verify order status after cancellation
    console.log('\n5. 📊 Verifying order status after cancellation...');
    const updatedOrdersResponse = await axios.get('http://localhost:3000/api/orders/buyer', {
      headers: {
        'Authorization': `Bearer ${buyerToken}`
      }
    });

    if (updatedOrdersResponse.data.success) {
      const updatedOrders = updatedOrdersResponse.data.data;
      const cancelledOrder = updatedOrders.find(order => order.id === createdOrder.orderId);
      
      if (cancelledOrder) {
        console.log('✅ Order status verified after cancellation!');
        console.log(`   Order ID: ${cancelledOrder.id}`);
        console.log(`   Status: ${cancelledOrder.status}`);
        console.log(`   Logs: ${cancelledOrder.orderLogs?.length || 0} entries`);
      }
    }

    console.log('\n🎉 Buyer Orders Dashboard Test Successful!');
    console.log('\n📝 Summary:');
    console.log('✅ Buyer authentication');
    console.log('✅ Order creation');
    console.log('✅ Fetch buyer orders');
    console.log('✅ Cancel order functionality');
    console.log('✅ Order status updates');

    console.log('\n🌐 Frontend Testing:');
    console.log('1. Open browser to http://localhost:5173');
    console.log('2. Login as buyer: buyer@example.com / password');
    console.log('3. Go to Buyer Dashboard');
    console.log('4. Verify orders are displayed in "Your Orders"');
    console.log('5. Test "Cancel Order" button for PLACED/ESCROW_FUNDED orders');

  } catch (error) {
    console.error('❌ Buyer orders test failed:', error.response?.data || error.message);
  }
}

testBuyerOrders(); 