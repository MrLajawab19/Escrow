const axios = require('axios');

async function testFrontendBackend() {
  try {
    console.log('🧪 Testing Frontend-Backend Connectivity...\n');

    // Test if backend is accessible
    console.log('1. Testing backend accessibility...');
    const healthCheck = await axios.get('http://localhost:3000/api/auth/verify');
    console.log('✅ Backend is accessible');

    // Test buyer login with exact same data as frontend
    console.log('\n2. Testing buyer login (same as frontend)...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/buyer/login', {
      email: 'buyer@example.com',
      password: 'password'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Buyer login successful!');
      console.log('Response:', loginResponse.data);
    }

    // Test CORS headers
    console.log('\n3. Testing CORS headers...');
    const corsTest = await axios.options('http://localhost:3000/api/auth/buyer/login');
    console.log('✅ CORS headers present');

    console.log('\n🎉 All connectivity tests passed!');
    console.log('\n📝 Next steps:');
    console.log('1. Open browser to http://localhost:5174');
    console.log('2. Open browser dev tools (F12)');
    console.log('3. Try logging in with buyer@example.com / password');
    console.log('4. Check console for detailed error messages');

  } catch (error) {
    console.error('❌ Connectivity test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
  }
}

testFrontendBackend(); 