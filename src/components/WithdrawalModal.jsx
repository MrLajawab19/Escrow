import React, { useState } from 'react';
import axios from 'axios';
import { useCurrency } from '../context/CurrencyContext';

const WithdrawalModal = ({ isOpen, onClose, walletBalance = 0, walletCurrency = 'USD', onSuccess }) => {
  const { formatCurrency, formatCurrencyRaw, currencySymbol, currency, exchangeRates } = useCurrency();
  const maxAmount = Math.max(0, formatCurrencyRaw(walletBalance, walletCurrency));
  const isNegative = walletBalance <= 0;
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
      setError(`Please enter a valid amount (Max: ${currencySymbol}${maxAmount.toFixed(2)})`);
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
      // Convert local input amount back to wallet base currency
      const rateToLocal = (exchangeRates[currency] || 1) / (exchangeRates[walletCurrency] || 1);
      const amountInBaseCurrency = parseFloat(amount) / rateToLocal;
      
      setLoading(true);
      const response = await axios.post('/api/wallet/withdraw', {
        amount: Math.round(amountInBaseCurrency * 100),
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
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-primary">Withdraw Funds</h2>
            <p className="text-sm text-gray-600 dark:text-dark-muted mt-1">Step {step} of 3</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-dark-primary dark:text-dark-primary text-2xl"
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
            <p className="text-gray-600 dark:text-dark-muted mb-2">Your withdrawal request has been submitted.</p>
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg text-left">
              <p className="text-sm font-semibold text-orange-800">⚠️ Payouts are not live</p>
              <p className="text-xs text-orange-700 mt-1">
                The database reflects your withdrawal, but real payouts require RazorpayX business onboarding. No real money will be sent to your bank account at this time.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={step === 1 ? handleAmountSubmit : step === 2 ? handleBankDetailsSubmit : handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {isNegative && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-sm">
                Your balance is negative due to outstanding dispute penalties — no funds available to withdraw.
              </div>
            )}

            {/* Step 1: Amount */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-dark-primary mb-2">
                    Available Balance
                  </label>
                  <p className="text-2xl font-bold text-blue-600">{currencySymbol}{maxAmount.toFixed(2)}</p>
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 dark:text-dark-primary mb-2">
                    Withdrawal Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-600 dark:text-dark-muted font-semibold">{currencySymbol}</span>
                    <input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      max={maxAmount}
                      disabled={isNegative}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-dark-muted mt-1">Minimum: {currencySymbol}10 | Maximum: {currencySymbol}{maxAmount.toFixed(2)}</p>
                </div>

                {/* Fee Preview */}
                {amount && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 dark:text-dark-primary">Withdrawal Amount:</span>
                      <span className="font-semibold text-gray-900 dark:text-dark-primary">{currencySymbol}{parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 dark:text-dark-primary">Withdrawal Fee (2%):</span>
                      <span className="font-semibold text-gray-900 dark:text-dark-primary">-{currencySymbol}{estimatedFee}</span>
                    </div>
                    <div className="border-t border-yellow-300 pt-2 flex justify-between">
                      <span className="text-gray-700 dark:text-dark-primary font-semibold">You'll receive:</span>
                      <span className="font-bold text-yellow-600">{currencySymbol}{netAmount}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Bank Details */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="accountHolder" className="block text-sm font-semibold text-gray-700 dark:text-dark-primary mb-2">
                    Account Holder Name *
                  </label>
                  <input
                    id="accountHolder"
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label htmlFor="bankName" className="block text-sm font-semibold text-gray-700 dark:text-dark-primary mb-2">
                    Bank Name *
                  </label>
                  <input
                    id="bankName"
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., Chase Bank"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-semibold text-gray-700 dark:text-dark-primary mb-2">
                    Account Number *
                  </label>
                  <input
                    id="accountNumber"
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Your account number"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label htmlFor="routingNumber" className="block text-sm font-semibold text-gray-700 dark:text-dark-primary mb-2">
                    Routing Number (US)
                  </label>
                  <input
                    id="routingNumber"
                    type="text"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="9-digit routing number"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label htmlFor="swiftCode" className="block text-sm font-semibold text-gray-700 dark:text-dark-primary mb-2">
                    SWIFT Code (International)
                  </label>
                  <input
                    id="swiftCode"
                    type="text"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                    placeholder="SWIFT/BIC code"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <p className="text-xs text-gray-500 dark:text-dark-muted">* Required fields</p>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-dark-primary">Amount:</span>
                    <span className="font-semibold">{currencySymbol}{parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-dark-primary">Fee (2%):</span>
                    <span className="font-semibold">-{currencySymbol}{estimatedFee}</span>
                  </div>
                  <div className="border-t border-blue-300 pt-3 flex justify-between">
                    <span className="text-gray-700 dark:text-dark-primary font-semibold">You'll receive:</span>
                    <span className="font-bold text-blue-600">{currencySymbol}{netAmount}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-dark-primary">Bank Details</h4>
                  <p className="text-sm text-gray-700 dark:text-dark-primary">
                    <strong>Account:</strong> {accountHolder}<br/>
                    <strong>Bank:</strong> {bankName}<br/>
                    <strong>Account #:</strong> ****{accountNumber.slice(-4)}
                  </p>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm text-yellow-800">
                  <strong>Note:</strong> Please verify your bank details carefully. Withdrawals typically take 2-5 business days to process.
                </div>

                <div className="text-xs text-gray-600 dark:text-dark-muted">
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
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-primary font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-dark-elevated dark:bg-dark-bg transition"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className={`flex-1 px-4 py-3 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-primary font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-dark-elevated dark:bg-dark-bg transition ${step > 1 ? '' : ''}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !amount || isNegative}
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
