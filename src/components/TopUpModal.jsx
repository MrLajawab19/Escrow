import React, { useState } from 'react';
import axios from 'axios';
import { useCurrency } from '../context/CurrencyContext';

const TopUpModal = ({ isOpen, onClose, onSuccess }) => {
  const { formatCurrency, currencySymbol } = useCurrency();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const predefinedAmounts = [10, 25, 50, 100, 250, 500];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/wallet/top-up', {
        amount: parseFloat(amount),
        paymentMethod,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process top-up');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setPaymentMethod('card');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Funds</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✓</div>
            <h3 className="text-xl font-bold text-green-600 mb-2">Success!</h3>
            <p className="text-gray-600">Your top-up of {currencySymbol}{amount} has been processed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Predefined Amounts */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Quick Select
              </label>
              <div className="grid grid-cols-3 gap-2">
                {predefinedAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset.toString())}
                    className={`py-2 px-4 rounded-lg font-semibold transition ${
                      amount === preset.toString()
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {currencySymbol}{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
                Enter Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-600 font-semibold">{currencySymbol}</span>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum: {currencySymbol}1 | Maximum: {currencySymbol}10,000</p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="card">Credit/Debit Card</option>
                <option value="bank-transfer">Bank Transfer</option>
                <option value="digital-wallet">Digital Wallet</option>
                <option value="cryptocurrency">Cryptocurrency</option>
              </select>
            </div>

            {/* Fee Information */}
            {amount && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700">Amount:</span>
                  <span className="font-semibold text-gray-900">{currencySymbol}{parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700">Processing Fee (1%):</span>
                  <span className="font-semibold text-gray-900">
                    {currencySymbol}{(parseFloat(amount) * 0.01).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-blue-300 pt-2 flex justify-between">
                  <span className="text-gray-700 font-semibold">You'll get:</span>
                  <span className="font-bold text-blue-600">
                    {currencySymbol}{(parseFloat(amount) * 0.99).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Terms & Conditions */}
            <div className="text-xs text-gray-600">
              <input
                type="checkbox"
                id="terms"
                required
                className="mr-2"
              />
              <label htmlFor="terms">
                I agree to the Terms & Conditions and Privacy Policy
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !amount}
                className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>+ Add {currencySymbol}{amount || '0.00'}</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TopUpModal;
