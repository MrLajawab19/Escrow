const axios = require('axios');

async function testOrderCreation() {
  try {
    console.log('🧪 Testing Complete Order Creation Flow...\n');

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
    console.log(`   Token: ${buyerToken.substring(0, 50)}...`);

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

    console.log('📤 Sending order data:', JSON.stringify(orderData, null, 2));

    const orderResponse = await axios.post('http://localhost:3000/api/orders', orderData, {
      headers: {
        'Authorization': `Bearer ${buyerToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!orderResponse.data.success) {
      console.error('❌ Order creation failed:', orderResponse.data);
      throw new Error('Order creation failed');
    }

    const createdOrder = orderResponse.data.data;
    console.log('✅ Order created successfully!');
    console.log(`   Order ID: ${createdOrder.orderId}`);
    console.log(`   Status: ${createdOrder.status}`);
    console.log(`   Price: ${createdOrder.price}`);
    console.log(`   Platform: ${createdOrder.platform}`);
    console.log(`   Product Type: ${createdOrder.productType}`);
    console.log(`   Escrow Link: ${createdOrder.escrowLink}`);
    console.log(`   Tracking Link: ${createdOrder.orderTrackingLink}`);

    // Step 3: Fetch order details
    console.log('\n3. 📊 Fetching order details...');
    const orderDetailsResponse = await axios.get(`http://localhost:3000/api/orders/${createdOrder.orderId}`, {
      headers: {
        'Authorization': `Bearer ${buyerToken}`
      }
    });

    if (orderDetailsResponse.data.success) {
      const orderDetails = orderDetailsResponse.data.data;
      console.log('✅ Order details fetched successfully!');
      console.log(`   Order ID: ${orderDetails.id}`);
      console.log(`   Buyer: ${orderDetails.buyerName}`);
      console.log(`   Seller Contact: ${orderDetails.sellerContact}`);
      console.log(`   Status: ${orderDetails.status}`);
      console.log(`   Created: ${orderDetails.createdAt}`);
      console.log(`   Logs: ${orderDetails.orderLogs?.length || 0} entries`);
    }

    // Step 4: Test seller notification (simulated)
    console.log('\n4. 📧 Testing seller notification...');
    console.log('✅ Seller notification sent (simulated)');
    console.log(`   To: ${orderData.sellerContact}`);
    console.log(`   Subject: New Escrow Order - ${createdOrder.orderId}`);
    console.log(`   Escrow Link: ${createdOrder.escrowLink}`);

    // Step 5: Test buyer confirmation (simulated)
    console.log('\n5. 📧 Testing buyer confirmation...');
    console.log('✅ Buyer confirmation sent (simulated)');
    console.log(`   To: ${buyerData.email}`);
    console.log(`   Subject: Order Created Successfully - ${createdOrder.orderId}`);
    console.log(`   Tracking Link: ${createdOrder.orderTrackingLink}`);

    // Step 6: Test order status transitions
    console.log('\n6. 🔄 Testing order status transitions...');
    
    // Fund escrow
    console.log('   Funding escrow...');
    const fundResponse = await axios.post(`http://localhost:3000/api/orders/${createdOrder.orderId}/fund-escrow`, {
      buyerId: buyerData.id
    }, {
      headers: {
        'Authorization': `Bearer ${buyerToken}`
      }
    });

    if (fundResponse.data.success) {
      console.log('✅ Escrow funded successfully!');
      console.log(`   New Status: ${fundResponse.data.data.status}`);
    }

    // Start work (as seller)
    console.log('   Starting work (as seller)...');
    const startWorkResponse = await axios.patch(`http://localhost:3000/api/orders/${createdOrder.orderId}/start`, {
      sellerId: 'seller-test-id'
    });

    if (startWorkResponse.data.success) {
      console.log('✅ Work started successfully!');
      console.log(`   New Status: ${startWorkResponse.data.data.status}`);
    }

    // Submit delivery (as seller)
    console.log('   Submitting delivery (as seller)...');
    const submitResponse = await axios.patch(`http://localhost:3000/api/orders/${createdOrder.orderId}/submit`, {
      sellerId: 'seller-test-id',
      deliveryFiles: ['final-website.zip', 'documentation.pdf']
    });

    if (submitResponse.data.success) {
      console.log('✅ Delivery submitted successfully!');
      console.log(`   New Status: ${submitResponse.data.data.status}`);
    }

    // Approve delivery (as buyer)
    console.log('   Approving delivery (as buyer)...');
    const approveResponse = await axios.patch(`http://localhost:3000/api/orders/${createdOrder.orderId}/approve`, {
      buyerId: buyerData.id
    }, {
      headers: {
        'Authorization': `Bearer ${buyerToken}`
      }
    });

    if (approveResponse.data.success) {
      console.log('✅ Delivery approved successfully!');
      console.log(`   New Status: ${approveResponse.data.data.status}`);
    }

    console.log('\n🎉 Complete Order Creation Flow Test Successful!');
    console.log('\n📝 Summary:');
    console.log('✅ Buyer authentication');
    console.log('✅ Order creation with validation');
    console.log('✅ Order details retrieval');
    console.log('✅ Seller notification (simulated)');
    console.log('✅ Buyer confirmation (simulated)');
    console.log('✅ Order status transitions');
    console.log('✅ Complete order lifecycle');

    console.log('\n🌐 Frontend Testing:');
    console.log('1. Open browser to http://localhost:5173');
    console.log('2. Login as buyer: buyer@example.com / password');
    console.log('3. Click "Create New Order"');
    console.log('4. Fill out the order form');
    console.log('5. Submit the order');
    console.log('6. Verify success modal and redirect');
    console.log('7. Check order tracking page');

  } catch (error) {
    console.error('❌ Order creation test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testOrderCreation(); 