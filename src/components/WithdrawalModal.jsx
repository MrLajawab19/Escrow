import React, { useState } from 'react';
import axios from 'axios';

const WithdrawalModal = ({ isOpen, onClose, onSuccess, maxAmount }) => {
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Amount, Step 2: Bank Details, Step 3: Confirmation

  const handleAmountSubmit = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0 || amount > maxAmount) {
      setError(`Please enter a valid amount (Max: $${maxAmount.toFixed(2)})`);
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleBankDetailsSubmit = (e) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !accountHolder) {
      setError('Please fill in all required fields');
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const bankDetails = {
      bankName,
      accountNumber,
      accountHolder,
      routingNumber,
      swiftCode,
    };

    try {
      setLoading(true);
      const response = await axios.post('/api/wallet/withdraw', {
        amount: parseFloat(amount),
        bankDetails,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process withdrawal');
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setBankName('');
    setAccountNumber('');
    setAccountHolder('');
    setRoutingNumber('');
    setSwiftCode('');
    setError(null);
    setSuccess(false);
    setStep(1);
    onClose();
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  if (!isOpen) return null;

  const estimatedFee = amount ? (parseFloat(amount) * 0.02).toFixed(2) : '0.00';
  const netAmount = amount ? (parseFloat(amount) - estimatedFee).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Withdraw Funds</h2>
            <p className="text-sm text-gray-600 mt-1">Step {step} of 3</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition ${
                s <= step ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            ></div>
          ))}
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✓</div>
            <h3 className="text-xl font-bold text-green-600 mb-2">Success!</h3>
            <p className="text-gray-600 mb-2">Your withdrawal request has been submitted.</p>
            <p className="text-sm text-gray-500">
              You'll receive ${netAmount} to your account in 2-5 business days.
            </p>
          </div>
        ) : (
          <form onSubmit={step === 1 ? handleAmountSubmit : step === 2 ? handleBankDetailsSubmit : handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Step 1: Amount */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Available Balance
                  </label>
                  <p className="text-2xl font-bold text-blue-600">${maxAmount.toFixed(2)}</p>
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
                    Withdrawal Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-600 font-semibold">$</span>
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
                  <p className="text-xs text-gray-500 mt-1">Minimum: $10 | Maximum: ${maxAmount.toFixed(2)}</p>
                </div>

                {/* Fee Preview */}
                {amount && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Withdrawal Amount:</span>
                      <span className="font-semibold text-gray-900">${parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Withdrawal Fee (2%):</span>
                      <span className="font-semibold text-gray-900">-${estimatedFee}</span>
                    </div>
                    <div className="border-t border-yellow-300 pt-2 flex justify-between">
                      <span className="text-gray-700 font-semibold">You'll receive:</span>
                      <span className="font-bold text-yellow-600">${netAmount}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Bank Details */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="accountHolder" className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Holder Name *
                  </label>
                  <input
                    id="accountHolder"
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label htmlFor="bankName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank Name *
                  </label>
                  <input
                    id="bankName"
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., Chase Bank"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Number *
                  </label>
                  <input
                    id="accountNumber"
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Your account number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label htmlFor="routingNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                    Routing Number (US)
                  </label>
                  <input
                    id="routingNumber"
                    type="text"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="9-digit routing number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label htmlFor="swiftCode" className="block text-sm font-semibold text-gray-700 mb-2">
                    SWIFT Code (International)
                  </label>
                  <input
                    id="swiftCode"
                    type="text"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                    placeholder="SWIFT/BIC code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <p className="text-xs text-gray-500">* Required fields</p>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Amount:</span>
                    <span className="font-semibold">${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Fee (2%):</span>
                    <span className="font-semibold">-${estimatedFee}</span>
                  </div>
                  <div className="border-t border-blue-300 pt-3 flex justify-between">
                    <span className="text-gray-700 font-semibold">You'll receive:</span>
                    <span className="font-bold text-blue-600">${netAmount}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Bank Details</h4>
                  <p className="text-sm text-gray-700">
                    <strong>Account:</strong> {accountHolder}<br/>
                    <strong>Bank:</strong> {bankName}<br/>
                    <strong>Account #:</strong> ****{accountNumber.slice(-4)}
                  </p>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm text-yellow-800">
                  <strong>Note:</strong> Please verify your bank details carefully. Withdrawals typically take 2-5 business days to process.
                </div>

                <div className="text-xs text-gray-600">
                  <input
                    type="checkbox"
                    id="confirm"
                    required
                    className="mr-2"
                  />
                  <label htmlFor="confirm">
                    I confirm that the bank details are correct and I'm ready to proceed.
                  </label>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className={`flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition ${step > 1 ? '' : ''}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !amount}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : step === 3 ? (
                  'Confirm Withdrawal'
                ) : (
                  'Next'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WithdrawalModal;
