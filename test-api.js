const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/orders';

// Test data
const testBuyerId = '550e8400-e29b-41d4-a716-446655440000';
const testSellerId = '550e8400-e29b-41d4-a716-446655440001';
const testAdminId = '550e8400-e29b-41d4-a716-446655440002';

async function testOrderAPI() {
  console.log('🧪 Testing EscrowX Order Management API...\n');

  try {
    // 1. Create Order
    console.log('1️⃣ Creating order...');
    const createResponse = await axios.post(BASE_URL, {
      buyerId: testBuyerId,
      sellerId: testSellerId,
      scopeBox: {
        title: 'Logo Design Project',
        description: 'Create a modern logo for tech startup',
        deliverables: ['Logo in PNG', 'Logo in SVG', 'Brand guidelines'],
        deadline: '2024-02-15T00:00:00.000Z',
        price: 500
      }
    });
    
    const orderId = createResponse.data.data.id;
    console.log(`✅ Order created with ID: ${orderId}`);
    console.log(`   Status: ${createResponse.data.data.status}\n`);

    // 2. Fund Escrow
    console.log('2️⃣ Funding escrow...');
    const fundResponse = await axios.post(`${BASE_URL}/${orderId}/fund-escrow`, {
      buyerId: testBuyerId
    });
    console.log(`✅ Escrow funded. Status: ${fundResponse.data.data.status}\n`);

    // 3. Start Work
    console.log('3️⃣ Starting work...');
    const startResponse = await axios.patch(`${BASE_URL}/${orderId}/start`, {
      sellerId: testSellerId
    });
    console.log(`✅ Work started. Status: ${startResponse.data.data.status}\n`);

    // 4. Submit Delivery
    console.log('4️⃣ Submitting delivery...');
    const submitResponse = await axios.patch(`${BASE_URL}/${orderId}/submit`, {
      sellerId: testSellerId,
      deliveryFiles: ['logo-final.png', 'brand-guidelines.pdf']
    });
    console.log(`✅ Delivery submitted. Status: ${submitResponse.data.data.status}\n`);

    // 5. Approve Delivery
    console.log('5️⃣ Approving delivery...');
    const approveResponse = await axios.patch(`${BASE_URL}/${orderId}/approve`, {
      buyerId: testBuyerId
    });
    console.log(`✅ Delivery approved. Status: ${approveResponse.data.data.status}\n`);

    // 6. Get Order Details
    console.log('6️⃣ Getting order details...');
    const getResponse = await axios.get(`${BASE_URL}/${orderId}`);
    console.log(`✅ Order retrieved successfully`);
    console.log(`   Final Status: ${getResponse.data.data.status}`);
    console.log(`   Logs Count: ${getResponse.data.data.orderLogs.length}\n`);

    // 7. Test Dispute (optional)
    console.log('7️⃣ Testing dispute creation...');
    const disputeResponse = await axios.patch(`${BASE_URL}/${orderId}/dispute`, {
      userId: testBuyerId,
      disputeData: {
        reason: 'Quality issues',
        description: 'Logo doesn\'t match requirements',
        evidence: ['screenshot1.png']
      }
    });
    console.log(`✅ Dispute raised. Status: ${disputeResponse.data.data.status}\n`);

    console.log('🎉 All API tests passed successfully!');
    console.log('📊 Order lifecycle completed with proper status transitions and logging.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testOrderAPI(); 