const EXCHANGE_RATES = {
  USD: 1,
  INR: 83,
  EUR: 0.92,
  GBP: 0.79
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - The amount in source currency (in cents)
 * @param {string} sourceCurrency - The source currency code (e.g., 'USD')
 * @param {string} targetCurrency - The target currency code (e.g., 'INR')
 * @returns {number} The converted amount in target currency (in cents)
 */
function convertCurrency(amount, sourceCurrency = 'USD', targetCurrency = 'USD') {
  if (sourceCurrency === targetCurrency) return amount;
  
  // 1. Convert to USD base
  let amountInUSD = amount;
  if (sourceCurrency !== 'USD' && EXCHANGE_RATES[sourceCurrency]) {
    amountInUSD = amount / EXCHANGE_RATES[sourceCurrency];
  }
  
  // 2. Convert from USD to Target
  const rate = EXCHANGE_RATES[targetCurrency] || 1;
  return Math.round(amountInUSD * rate);
}

module.exports = {
  EXCHANGE_RATES,
  convertCurrency
};
