const axios = require('axios');

async function testNavigationFlow() {
  try {
    console.log('🧪 Testing Navigation Flow...\n');

    // Test login
    console.log('1. Testing buyer login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/buyer/login', {
      email: 'buyer@example.com',
      password: 'password'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful!');
      console.log('User:', loginResponse.data.user.firstName, loginResponse.data.user.lastName);
      console.log('Token:', loginResponse.data.token.substring(0, 50) + '...');
      
      console.log('\n📝 Navigation should now show:');
      console.log('- "Buyer Dashboard" instead of "Buyer Login"');
      console.log('- "Welcome, John" (user name)');
      console.log('- "Logout" button');
      
      console.log('\n🌐 Test Steps:');
      console.log('1. Open browser to http://localhost:5173');
      console.log('2. Login with buyer@example.com / password');
      console.log('3. Check that navigation shows "Buyer Dashboard"');
      console.log('4. Check that it shows "Welcome, John"');
      console.log('5. Try the logout button');
    }

  } catch (error) {
    console.error('❌ Navigation test failed:', error.response?.data || error.message);
  }
}

testNavigationFlow(); 