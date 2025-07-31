const axios = require('axios');

async function testAuth() {
  try {
    console.log('🧪 Testing Authentication API...\n');

    // Test buyer login
    console.log('1. Testing buyer login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/buyer/login', {
      email: 'buyer@example.com',
      password: 'password'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Buyer login successful!');
      console.log('Token:', loginResponse.data.token.substring(0, 50) + '...');
      console.log('User:', loginResponse.data.user.email);
    }

    // Test buyer signup
    console.log('\n2. Testing buyer signup...');
    const signupResponse = await axios.post('http://localhost:3000/api/auth/buyer/signup', {
      email: 'testbuyer@example.com',
      password: 'testpassword123',
      firstName: 'Test',
      lastName: 'Buyer',
      phone: '+1 (555) 999-8888',
      country: 'US'
    });
    
    if (signupResponse.data.success) {
      console.log('✅ Buyer signup successful!');
      console.log('User ID:', signupResponse.data.user.id);
    }

    // Test token verification
    console.log('\n3. Testing token verification...');
    const verifyResponse = await axios.get('http://localhost:3000/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });
    
    if (verifyResponse.data.success) {
      console.log('✅ Token verification successful!');
    }

    console.log('\n🎉 All authentication tests passed!');
    console.log('\n📝 Test Accounts:');
    console.log('Buyer: buyer@example.com / password');
    console.log('Seller: seller@example.com / password');

  } catch (error) {
    console.error('❌ Authentication test failed:', error.response?.data || error.message);
  }
}

testAuth(); 