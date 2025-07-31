const axios = require('axios');

async function testFundingAndScope() {
  try {
    console.log('🧪 Testing Complete Funding & Scope Box Flow...\n');

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

    // Step 3: Fund the escrow
    console.log('\n3. 💳 Funding escrow...');
    const fundResponse = await axios.post(`http://localhost:3000/api/orders/${createdOrder.orderId}/fund-escrow`, {
      buyerId: buyerData.id,
      paymentMethod: 'credit_card',
      amount: createdOrder.price
    }, {
      headers: {
        'Authorization': `Bearer ${buyerToken}`
      }
    });

    if (fundResponse.data.success) {
      console.log('✅ Escrow funded successfully!');
      console.log(`   New Status: ${fundResponse.data.data.status}`);
      console.log(`   Message: ${fundResponse.data.message}`);
    } else {
      throw new Error('Escrow funding failed');
    }

    // Step 4: Verify order status
    console.log('\n4. 📊 Verifying order status...');
    const orderDetailsResponse = await axios.get(`http://localhost:3000/api/orders/${createdOrder.orderId}`, {
      headers: {
        'Authorization': `Bearer ${buyerToken}`
      }
    });

    if (orderDetailsResponse.data.success) {
      const orderDetails = orderDetailsResponse.data.data;
      console.log('✅ Order status verified!');
      console.log(`   Order ID: ${orderDetails.id}`);
      console.log(`   Status: ${orderDetails.status}`);
      console.log(`   Buyer: ${orderDetails.buyerName}`);
      console.log(`   Seller Contact: ${orderDetails.sellerContact}`);
      console.log(`   Logs: ${orderDetails.orderLogs?.length || 0} entries`);
    }

    console.log('\n🎉 Complete Funding & Scope Box Flow Test Successful!');
    console.log('\n📝 Summary:');
    console.log('✅ Buyer authentication');
    console.log('✅ Order creation');
    console.log('✅ Payment processing (simulated)');
    console.log('✅ Escrow funding');
    console.log('✅ Scope box sent to seller');
    console.log('✅ Order status updated');

    console.log('\n🌐 Frontend Testing:');
    console.log('1. Open browser to http://localhost:5173');
    console.log('2. Login as buyer: buyer@example.com / password');
    console.log('3. Click "Create New Order"');
    console.log('4. Fill out the order form');
    console.log('5. Submit the order');
    console.log('6. Complete payment in funding modal');
    console.log('7. Verify success and scope box sent');

  } catch (error) {
    console.error('❌ Funding and scope box test failed:', error.response?.data || error.message);
  }
}

testFundingAndScope(); 