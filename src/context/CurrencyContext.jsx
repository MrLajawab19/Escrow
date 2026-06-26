import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => localStorage.getItem('preferredCurrency') || 'USD');
  const [exchangeRates, setExchangeRates] = useState({ USD: 1, INR: 83, EUR: 0.92, GBP: 0.79 }); // Fallback rates
  const [loadingRates, setLoadingRates] = useState(true);

  const currencySymbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£'
  };

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoadingRates(true);
        // Using a free, public API that doesn't require authentication for latest rates
        const response = await axios.get('https://open.er-api.com/v6/latest/USD');
        if (response.data && response.data.rates) {
          setExchangeRates({
            USD: response.data.rates.USD || 1,
            INR: response.data.rates.INR || 83,
            EUR: response.data.rates.EUR || 0.92,
            GBP: response.data.rates.GBP || 0.79
          });
        }
      } catch (error) {
        console.error('Failed to fetch live exchange rates, using fallback rates.', error);
      } finally {
        setLoadingRates(false);
      }
    };
    
    fetchRates();
    // Optional: Refresh rates every hour
    const interval = setInterval(fetchRates, 3600000);
    return () => clearInterval(interval);
  }, []);

  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('preferredCurrency', newCurrency);
  };

  const formatCurrency = (amountInUSD) => {
    const rate = exchangeRates[currency] || 1;
    const convertedAmount = parseFloat(amountInUSD || 0) * rate;
    const symbol = currencySymbols[currency] || '$';
    
    // Formatting correctly based on the locale to look native (e.g. 1,000.00)
    let locale = 'en-US';
    if (currency === 'INR') locale = 'en-IN';
    if (currency === 'EUR') locale = 'de-DE';
    if (currency === 'GBP') locale = 'en-GB';

    return `${symbol}${convertedAmount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatCurrencyRaw = (amountInUSD) => {
    const rate = exchangeRates[currency] || 1;
    return parseFloat(amountInUSD || 0) * rate;
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      changeCurrency, 
      formatCurrency,
      formatCurrencyRaw,
      currencySymbol: currencySymbols[currency] || '$', 
      availableCurrencies: Object.keys(currencySymbols),
      loadingRates
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
