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
    
    const handleStorageChange = (e) => {
      if (e.key === 'preferredCurrency' && e.newValue) {
        setCurrency(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('preferredCurrency', newCurrency);
  };

  const formatCurrency = (amount, sourceCurrency = 'USD') => {
    // 1. Original representation
    let originalAmount = parseFloat(amount || 0) / 100;
    const originalSymbol = currencySymbols[sourceCurrency] || '$';
    let originalLocale = 'en-US';
    if (sourceCurrency === 'INR') originalLocale = 'en-IN';
    if (sourceCurrency === 'EUR') originalLocale = 'de-DE';
    if (sourceCurrency === 'GBP') originalLocale = 'en-GB';
    
    const originalFormatted = `${originalSymbol}${originalAmount.toLocaleString(originalLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

    // If preferred currency matches source, just return the original
    if (sourceCurrency === currency) return originalFormatted;

    // 2. Convert source to USD
    let amountInUSD = originalAmount;
    if (sourceCurrency !== 'USD' && exchangeRates[sourceCurrency]) {
      amountInUSD = amountInUSD / exchangeRates[sourceCurrency];
    }
    
    // 3. Convert USD to target currency
    const rate = exchangeRates[currency] || 1;
    const convertedAmount = amountInUSD * rate;
    const targetSymbol = currencySymbols[currency] || '$';
    
    let targetLocale = 'en-US';
    if (currency === 'INR') targetLocale = 'en-IN';
    if (currency === 'EUR') targetLocale = 'de-DE';
    if (currency === 'GBP') targetLocale = 'en-GB';

    const targetFormatted = `${targetSymbol}${convertedAmount.toLocaleString(targetLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

    return `${originalFormatted} (≈${targetFormatted})`;
  };

  const formatCurrencyRaw = (amount, sourceCurrency = 'USD') => {
    let amountInUSD = parseFloat(amount || 0) / 100;
    if (sourceCurrency !== 'USD' && exchangeRates[sourceCurrency]) {
      amountInUSD = amountInUSD / exchangeRates[sourceCurrency];
    }
    const rate = exchangeRates[currency] || 1;
    return amountInUSD * rate;
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
