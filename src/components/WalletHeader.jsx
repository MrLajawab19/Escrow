import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCurrency } from '../context/CurrencyContext';

const WalletHeader = ({ userId, onNavigateToWallet }) => {
  const { formatCurrency } = useCurrency();
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWalletBalance();
    const interval = setInterval(fetchWalletBalance, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const fetchWalletBalance = async () => {
    try {
      const response = await axios.get('/api/wallet/summary');
      setBalance(response.data.data.balance || 0);
      setCurrency(response.data.data.currency || 'USD');
      setError(null);
    } catch (err) {
      // Silent fail - don't show error in header
      setError(err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onNavigateToWallet}
      className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-lg hover:from-blue-100 hover:to-blue-200 transition cursor-pointer"
    >
      <div className="text-2xl">💰</div>
      <div className="text-left">
        <p className="text-xs text-gray-600 font-semibold">Wallet Balance</p>
        {loading ? (
          <p className="text-sm font-bold text-gray-700">Loading...</p>
        ) : error ? (
          <p className="text-sm font-bold text-red-600">Error</p>
        ) : (
          <p className="text-lg font-bold text-blue-600">
            {formatCurrency(balance, currency || 'INR')}
          </p>
        )}
      </div>
    </button>
  );
};

export default WalletHeader;
