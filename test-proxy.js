const axios = require('axios');

async function testProxy() {
  try {
    console.log('🧪 Testing Proxy Configuration...\n');

    // Test the proxy endpoint
    console.log('1. Testing proxy to backend...');
    const response = await axios.post('http://localhost:5173/api/auth/buyer/login', {
      email: 'buyer@example.com',
      password: 'password'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Proxy is working! Login successful via proxy');
      console.log('Token:', response.data.token.substring(0, 50) + '...');
    }

    console.log('\n🎉 Proxy test passed!');
    console.log('\n📝 Frontend should now work at:');
    console.log('http://localhost:5173');
    console.log('\nTry logging in with:');
    console.log('Email: buyer@example.com');
    console.log('Password: password');

  } catch (error) {
    console.error('❌ Proxy test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testProxy(); 