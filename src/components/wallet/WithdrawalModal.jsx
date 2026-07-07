import React, { useState } from 'react';
import { X, Building2, Smartphone, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const WithdrawalModal = ({ isOpen, onClose, maxAmount, onSuccess, userType }) => {
  const [method, setMethod] = useState('upi');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Bank Form State
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });

  // UPI Form State
  const [upiId, setUpiId] = useState('');

  if (!isOpen) return null;

  const handleBankInputChange = (e) => {
    const { name, value } = e.target;
    setBankDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (withdrawAmount > maxAmount) {
      setError(`Maximum withdrawal amount is ₹${maxAmount}`);
      return;
    }

    let payloadBankDetails = {};

    if (method === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g., name@okicici)');
        return;
      }
      payloadBankDetails = {
        method: 'upi',
        upiId
      };
    } else {
      if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
        setError('Please fill all bank details');
        return;
      }
      if (bankDetails.accountNumber !== bankDetails.confirmAccountNumber) {
        setError('Account numbers do not match');
        return;
      }
      payloadBankDetails = {
        method: 'bank',
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        accountHolderName: bankDetails.accountHolderName
      };
    }

    try {
      setLoading(true);
      const token = localStorage.getItem(`${userType}Token`);
      const response = await axios.post('/api/wallet/withdraw', {
        amount: withdrawAmount,
        bankDetails: payloadBankDetails
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(`Withdrawal of ₹${withdrawAmount} processed successfully`);
        if (onSuccess) onSuccess(response.data.data);
        onClose();
      } else {
        setError(response.data.message || 'Failed to process withdrawal');
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
      setError(err.response?.data?.message || 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-fade-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy-900 font-inter">Withdraw Funds</h2>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          
          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2 font-inter">Amount to Withdraw</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium text-lg">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="1"
                max={maxAmount}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-inter text-lg"
              />
            </div>
            <p className="text-sm text-neutral-500 mt-2 font-inter">
              Available to withdraw: <span className="font-bold text-navy-900">₹{maxAmount?.toFixed(2)}</span>
            </p>
          </div>

          {/* Method Selection Tabs */}
          <div className="flex bg-neutral-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setMethod('upi')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                method === 'upi' ? 'bg-white text-navy-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Smartphone size={18} />
              UPI Transfer
            </button>
            <button
              type="button"
              onClick={() => setMethod('bank')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                method === 'bank' ? 'bg-white text-navy-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Building2 size={18} />
              Bank Account
            </button>
          </div>

          {/* Dynamic Form Fields */}
          {method === 'upi' ? (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5 font-inter">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g., name@okhdfcbank"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-inter"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5 font-inter">Account Holder Name</label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={bankDetails.accountHolderName}
                  onChange={handleBankInputChange}
                  placeholder="As per bank records"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-inter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5 font-inter">Account Number</label>
                <input
                  type="password"
                  name="accountNumber"
                  value={bankDetails.accountNumber}
                  onChange={handleBankInputChange}
                  placeholder="Enter Account Number"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-inter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5 font-inter">Confirm Account Number</label>
                <input
                  type="text"
                  name="confirmAccountNumber"
                  value={bankDetails.confirmAccountNumber}
                  onChange={handleBankInputChange}
                  placeholder="Re-enter Account Number"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-inter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5 font-inter">IFSC Code</label>
                <input
                  type="text"
                  name="ifscCode"
                  value={bankDetails.ifscCode}
                  onChange={handleBankInputChange}
                  placeholder="e.g., HDFC0001234"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-inter uppercase"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                'Withdraw Funds'
              )}
            </button>
            <p className="text-center text-xs text-neutral-500 mt-3 flex items-center justify-center gap-1">
              <AlertCircle size={14} /> Withdrawals are processed securely via RazorpayX.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WithdrawalModal;
