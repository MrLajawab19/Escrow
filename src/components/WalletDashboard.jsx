import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TransactionHistory from './TransactionHistory';
import TopUpModal from './TopUpModal';
import WithdrawalModal from './WithdrawalModal';

const WalletDashboard = ({ userId }) => {
  const [wallet, setWallet] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch wallet data
  useEffect(() => {
    fetchWalletData();
  }, [userId, refreshTrigger]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const walletResponse = await axios.get('/api/wallet');
      setWallet(walletResponse.data.data);

      const summaryResponse = await axios.get('/api/wallet/summary');
      setSummary(summaryResponse.data.data);

      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUpSuccess = () => {
    setShowTopUpModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleWithdrawalSuccess = () => {
    setShowWithdrawalModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTopUpModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            + Add Funds
          </button>
          <button
            onClick={() => setShowWithdrawalModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-600 mb-2">Available Balance</h3>
          <p className="text-3xl font-bold text-blue-900">
            {summary?.balance?.toFixed(2) || '0.00'}{' '}
            <span className="text-lg">{summary?.currency || 'USD'}</span>
          </p>
          <p className="text-sm text-blue-600 mt-2">Ready to withdraw or use</p>
        </div>

        {/* Pending Balance */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
          <h3 className="text-sm font-semibold text-yellow-600 mb-2">Pending Balance</h3>
          <p className="text-3xl font-bold text-yellow-900">
            {summary?.pendingBalance?.toFixed(2) || '0.00'}{' '}
            <span className="text-lg">{summary?.currency || 'USD'}</span>
          </p>
          <p className="text-sm text-yellow-600 mt-2">Awaiting confirmation</p>
        </div>

        {/* Total Balance */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <h3 className="text-sm font-semibold text-green-600 mb-2">Total Balance</h3>
          <p className="text-3xl font-bold text-green-900">
            {((summary?.balance || 0) + (summary?.pendingBalance || 0)).toFixed(2)}{' '}
            <span className="text-lg">{summary?.currency || 'USD'}</span>
          </p>
          <p className="text-sm text-green-600 mt-2">Available + Pending</p>
        </div>
      </div>

      {/* Monthly Statistics */}
      {summary?.monthlyStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-gray-50 p-6 rounded-lg">
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">This Month Income</h4>
            <p className="text-2xl font-bold text-green-600">
              +{summary.monthlyStats.monthlyIncome?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">This Month Spent</h4>
            <p className="text-2xl font-bold text-red-600">
              -{summary.monthlyStats.monthlyExpense?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Net (This Month)</h4>
            <p className={`text-2xl font-bold ${summary.monthlyStats.monthlyNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.monthlyStats.monthlyNet >= 0 ? '+' : ''}{summary.monthlyStats.monthlyNet?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === 'overview'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === 'transactions'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Transactions
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 uppercase mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-blue-600">{summary?.totalTransactions || 0}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 uppercase mb-1">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                +{summary?.totalCredit?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 uppercase mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-red-600">
                -{summary?.totalDebit?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 uppercase mb-1">Last Transaction</p>
              <p className="text-lg font-semibold text-purple-600">
                {summary?.lastTransaction?.createdAt
                  ? new Date(summary.lastTransaction.createdAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Last Transaction */}
          {summary?.lastTransaction && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Last Transaction</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{summary.lastTransaction.description}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(summary.lastTransaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${summary.lastTransaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.lastTransaction.type === 'CREDIT' ? '+' : '-'}
                    {summary.lastTransaction.amount?.toFixed(2)}
                  </p>
                  <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">
                    {summary.lastTransaction.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <TransactionHistory userId={userId} refreshTrigger={refreshTrigger} />
      )}

      {/* Modals */}
      {showTopUpModal && (
        <TopUpModal
          isOpen={showTopUpModal}
          onClose={() => setShowTopUpModal(false)}
          onSuccess={handleTopUpSuccess}
        />
      )}

      {showWithdrawalModal && (
        <WithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          onSuccess={handleWithdrawalSuccess}
          maxAmount={summary?.balance || 0}
        />
      )}
    </div>
  );
};

export default WalletDashboard;
