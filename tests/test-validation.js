// TEST: Amount validation
// Run via: `node tests/test-validation.js`
// Validates edge cases for the global validateAmount utility (NaN, negative, zero, overflow).

const { validateAmount } = require('../backend/utils/validationUtils');

const testCases = [-50, "abc", 0, 10000000001, null];

testCases.forEach(amount => {
  try {
    console.log(`Testing amount: ${amount}`);
    validateAmount(amount);
    console.log(`  Success!`);
  } catch (error) {
    console.log(`  Caught Error: ${error.message}`);
  }
});
