// This file should be placed in backend/utils/validationUtils.js
function validateAmount(amount) {
  if (amount === undefined || amount === null) {
    throw new Error("AMOUNT_MISSING");
  }
  
  const parsedAmount = Number(amount);
  
  if (isNaN(parsedAmount) || !Number.isFinite(parsedAmount)) {
    throw new Error("INVALID_AMOUNT_FORMAT");
  }
  
  if (parsedAmount <= 0) {
    throw new Error("AMOUNT_MUST_BE_POSITIVE");
  }
  
  // Upper bound check to prevent integer overflow or absurd values
  // Assuming max transaction is 100 million (in whatever currency unit, e.g. 1,000,000.00 USD)
  const MAX_SAFE_AMOUNT = 10000000000;
  if (parsedAmount > MAX_SAFE_AMOUNT) {
    throw new Error("AMOUNT_EXCEEDS_MAXIMUM_LIMIT");
  }
  
  return parsedAmount;
}

module.exports = {
  validateAmount
};
