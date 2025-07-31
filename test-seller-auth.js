const axios = require('axios');

async function testSellerAuth() {
  try {
    console.log('🧪 Testing Seller Authentication...\n');

    // Test seller login
    console.log('1. Testing seller login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/seller/login', {
      email: 'seller@example.com',
      password: 'password'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Seller login successful!');
      console.log('User:', loginResponse.data.user.firstName, loginResponse.data.user.lastName);
      console.log('Business:', loginResponse.data.user.businessName);
      console.log('Token:', loginResponse.data.token.substring(0, 50) + '...');
    }

    // Test seller signup
    console.log('\n2. Testing seller signup...');
    const signupResponse = await axios.post('http://localhost:3000/api/auth/seller/signup', {
      email: 'newseller@example.com',
      password: 'testpassword123',
      firstName: 'New',
      lastName: 'Seller',
      phone: '+1 (555) 999-7777',
      country: 'US',
      businessName: 'New Seller Studio'
    });
    
    if (signupResponse.data.success) {
      console.log('✅ Seller signup successful!');
      console.log('User ID:', signupResponse.data.user.id);
      console.log('Status:', signupResponse.data.user.status);
    }

    console.log('\n🎉 Seller authentication tests completed!');
    console.log('\n📝 Test Accounts:');
    console.log('Seller: seller@example.com / password');
    console.log('Buyer: buyer@example.com / password');

  } catch (error) {
    console.error('❌ Seller auth test failed:', error.response?.data || error.message);
  }
}

testSellerAuth(); 