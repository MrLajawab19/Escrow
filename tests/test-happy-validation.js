async function runTests() {
  const baseUrl = 'http://localhost:3000/api';
  let token = '';

  try {
    const signupRes = await fetch(`${baseUrl}/auth/buyer/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test_deed_${Date.now()}@example.com`,
        password: 'Valid1Password',
        firstName: 'Test',
        lastName: 'User'
      })
    });
    const signupData = await signupRes.json();
    token = signupData.token;
  } catch (err) {}

  console.log('\nTesting Deed Creation Happy Path Details...');
  try {
    const deedRes = await fetch(`${baseUrl}/deeds/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Deed Title',
        description: 'Test Deed Description',
        amount: 500,
        currency: 'INR'
      })
    });
    const deedData = await deedRes.json();
    console.log('Deed Response:', deedRes.status, deedData);
  } catch (err) {}
}

runTests();
