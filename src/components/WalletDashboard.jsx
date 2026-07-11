import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TransactionHistory from './TransactionHistory';
import TopUpModal from './TopUpModal';
import WithdrawalModal from './WithdrawalModal';
import { useCurrency } from '../context/CurrencyContext';

// Animated Counter Component for premium feel
const AnimatedValue = ({ value, prefix = '', suffix = '' }) => {
  return (
    <span className="tabular-nums transition-all duration-500">
      {prefix}{Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
    </span>
  );
};

const WalletDashboard = ({ userId }) => {
  const [wallet, setWallet] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { currency, changeCurrency, availableCurrencies, currencySymbol, formatCurrencyRaw, loadingRates } = useCurrency();

  useEffect(() => {
    fetchWalletData();
  }, [userId, refreshTrigger]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const walletResponse = await axios.get('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken')}`
        }
      });
      setWallet(walletResponse.data.data);

      const summaryResponse = await axios.get('/api/wallet/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken')}`
        }
      });
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
      <div className="flex justify-center items-center h-[500px] w-full bg-slate-50/50 backdrop-blur-sm rounded-3xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-slate-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500 font-inter font-medium animate-pulse">Syncing wallet data...</p>
        </div>
      </div>
    );
  }

  const isBuyer = summary?.userRole === 'buyer';

  return (
    <div className="w-full bg-white/80 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden font-inter">
      {error && (
        <div className="m-6 p-4 bg-red-50/80 backdrop-blur-md border border-red-200 rounded-2xl text-red-700 shadow-sm flex items-center gap-3">
          <span className="text-xl">⚠️</span> {error}
        </div>
      )}

      {/* Header Section */}
      <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-slate-50 to-slate-100/50 border-b border-slate-200/60">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
              Financial Overview
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Manage your {isBuyer ? 'purchases and deposits' : 'earnings and withdrawals'} securely.
            </p>
          </div>
          <div className="flex gap-3">
            {isBuyer ? (
              <>
                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="group relative px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                  <span className="relative flex items-center gap-2">
                    <span className="text-lg">⊕</span> Add Funds
                  </span>
                </button>
                <button
                  onClick={() => setShowWithdrawalModal(true)}
                  className="group relative px-6 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span className="relative flex items-center gap-2">
                    <span className="text-lg">↗</span> Withdraw
                  </span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowWithdrawalModal(true)}
                className="group relative px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                <span className="relative flex items-center gap-2">
                  <span className="text-lg">↗</span> Withdraw
                </span>
              </button>
            )}

            <div className="relative">
              <select
                value={currency}
                onChange={(e) => changeCurrency(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-slate-700 font-semibold py-2.5 pl-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                disabled={loadingRates}
              >
                {availableCurrencies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* State Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {isBuyer ? (
            <>
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-xl shadow-emerald-500/20 text-white group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-20 text-5xl transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">💰</div>
                <h3 className="text-sm font-semibold text-emerald-100 mb-1 uppercase tracking-wider">Available Balance</h3>
                <p className="text-3xl font-black mb-2">
                  <span className="text-xl font-medium opacity-80 mr-1">{currencySymbol}</span>
                  <AnimatedValue value={formatCurrencyRaw(summary?.balance, summary?.currency || 'INR')} />
                </p>
                <p className="text-xs font-medium text-emerald-100/80 bg-black/10 inline-block px-2 py-1 rounded-md">Ready to use</p>
              </div>

              <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-500 text-5xl transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">🔒</div>
                <h3 className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Funds Locked</h3>
                <p className="text-3xl font-black text-slate-800 mb-2">
                  <span className="text-xl font-medium text-slate-400 mr-1">{currencySymbol}</span>
                  <AnimatedValue value={formatCurrencyRaw(summary?.lockedEscrowBalance, summary?.currency || 'INR')} />
                </p>
                <p className="text-xs font-medium text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-md">Secured in orders</p>
              </div>

              <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-500 text-5xl transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">⏳</div>
                <h3 className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Pending Refund</h3>
                <p className="text-3xl font-black text-slate-800 mb-2">
                  <span className="text-xl font-medium text-slate-400 mr-1">{currencySymbol}</span>
                  <AnimatedValue value={formatCurrencyRaw(summary?.pendingRefundBalance, summary?.currency || 'INR')} />
                </p>
                <p className="text-xs font-medium text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-md">From disputes</p>
              </div>

              <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-600 text-5xl transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">💎</div>
                <h3 className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Total Wallet Value</h3>
                <p className="text-3xl font-black text-slate-800 mb-2">
                  <span className="text-xl font-medium text-slate-400 mr-1">{currencySymbol}</span>
                  <AnimatedValue value={formatCurrencyRaw((Number(summary?.balance) || 0) + (Number(summary?.lockedEscrowBalance) || 0) + (Number(summary?.pendingRefundBalance) || 0), summary?.currency || 'INR')} />
                </p>
                <p className="text-xs font-medium text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-md">Overall equity</p>
              </div>

              <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-500 text-5xl transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">📈</div>
                <h3 className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Total Lifetime Deposits</h3>
                <p className="text-3xl font-black text-slate-800 mb-2">
                  <span className="text-xl font-medium text-slate-400 mr-1">{currencySymbol}</span>
                  <AnimatedValue value={formatCurrencyRaw(summary?.totalPurchases, summary?.currency || 'INR')} />
                </p>
                <p className="text-xs font-medium text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-md">Funds added</p>
              </div>

              <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-red-500 text-5xl transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">📉</div>
                <h3 className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Total Withdrawals</h3>
                <p className="text-3xl font-black text-slate-800 mb-2">
                  <span className="text-xl font-medium text-slate-400 mr-1">{currencySymbol}</span>
                  <AnimatedValue value={formatCurrencyRaw(summary?.totalDeposited, summary?.currency || 'INR')} />
                </p>
                <p className="text-xs font-medium text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-md">Funds withdrawn</p>
              </div>

              <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md group hover:-translate-y-1 transition-all duration-300 md:col-span-2 lg:col-span-2">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-500 text-5xl transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">📊</div>
                <h3 className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Total Transactions</h3>
                <p className="text-3xl font-black text-slate-800 mb-2">
                  <AnimatedValue value={summary?.totalTransactions} />
                </p>
                <p className="text-xs font-medium text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-md">Lifetime activities</p>
              </div>
            </>
          ) : (
            <>
              {/* Seller Cards */}
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 shadow-xl shadow-indigo-500/20 text-white group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-20 text-5xl transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">💳</div>
                <h3 className="text-sm font-semibold text-indigo-100 mb-1 uppercase tracking-wider">Available Earnings</h3>
                <p className="text-3xl font-black mb-2">
                  <span className="text-xl font-medium opacity-80 mr-1">{currencySymbol}</span>
                  <AnimatedValue value={formatCurrencyRaw(summary?.balance, summary?.currency || 'INR')} />
                </p>
                <p className="text-xs font-medium text-indigo-100/80 bg-black/10 inline-block px-2 py-1 rounded-md">Ready to withdraw</p>
              </div>

              <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-500 text-5xl transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">⏳</div>
                <h3 className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Pending Earnings</h3>
                <p className="text-3xl font-black text-slate-800 mb-2">
                  <span className="text-xl font-medium text-slate-400 mr-1">{currencySymbol}</span>
                  <AnimatedValue value={formatCurrencyRaw(summary?.pendingEarnings, summary?.currency || 'INR')} />
                </p>
                <p className="text-xs font-medium text-amber-600 bg-amber-50 inline-block px-2 py-1 rounded-md">From active orders</p>
              </div>

              <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-red-500 text-5xl transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">⚠️</div>
                <h3 className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Under Dispute</h3>
                <p className="text-3xl font-black text-slate-800 mb-2">
                  <span className="text-xl font-medium text-slate-400 mr-1">{currencySymbol}</span>
                  <AnimatedValue value={formatCurrencyRaw(summary?.underDisputeAmount, summary?.currency || 'INR')} />
                </p>
                <p className="text-xs font-medium text-red-600 bg-red-50 inline-block px-2 py-1 rounded-md">Funds frozen</p>
              </div>

              <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-600 text-5xl transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">💎</div>
                <h3 className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Total Wallet Value</h3>
                <p className="text-3xl font-black text-slate-800 mb-2">
                  <span className="text-xl font-medium text-slate-400 mr-1">{currencySymbol}</span>
                  <AnimatedValue value={formatCurrencyRaw((Number(summary?.balance) || 0) + (Number(summary?.pendingEarnings) || 0) + (Number(summary?.underDisputeAmount) || 0), summary?.currency || 'INR')} />
                </p>
                <p className="text-xs font-medium text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-md">Overall equity</p>
              </div>

              <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-500 text-5xl transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">🏦</div>
                <h3 className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Total Withdrawals</h3>
                <p className="text-3xl font-black text-slate-800 mb-2">
                  <span className="text-xl font-medium text-slate-400 mr-1">{currencySymbol}</span>
                  <AnimatedValue value={formatCurrencyRaw(summary?.withdrawnAmount, summary?.currency || 'INR')} />
                </p>
                <p className="text-xs font-medium text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-md">Lifetime withdrawn</p>
              </div>

              <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md group hover:-translate-y-1 transition-all duration-300 md:col-span-2 lg:col-span-3">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-500 text-5xl transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">📊</div>
                <h3 className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Total Transactions</h3>
                <p className="text-3xl font-black text-slate-800 mb-2">
                  <AnimatedValue value={summary?.totalTransactions} />
                </p>
                <p className="text-xs font-medium text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-md">Lifetime activities</p>
              </div>
            </>
          )}
        </div>

        {/* Analytics Section */}
        <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 mb-8">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">Monthly Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl">
                ↓
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">{isBuyer ? 'Deposits' : 'Income'}</p>
                <p className="text-xl font-bold text-slate-800">{currencySymbol}{formatCurrencyRaw(summary?.monthlyStats?.monthlyIncome || 0, summary?.currency || 'INR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xl">
                ↑
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">{isBuyer ? 'Purchases' : 'Withdrawn'}</p>
                <p className="text-xl font-bold text-slate-800">{currencySymbol}{formatCurrencyRaw(summary?.monthlyStats?.monthlyExpense || 0, summary?.currency || 'INR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${summary?.monthlyStats?.monthlyNet >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                {summary?.monthlyStats?.monthlyNet >= 0 ? '+' : '-'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Net Flow</p>
                <p className={`text-xl font-bold ${summary?.monthlyStats?.monthlyNet >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>
                  {currencySymbol}{formatCurrencyRaw(Math.abs(summary?.monthlyStats?.monthlyNet || 0), summary?.currency || 'INR')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2.5 font-semibold text-sm rounded-lg transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-2.5 font-semibold text-sm rounded-lg transition-all duration-200 ${
              activeTab === 'transactions'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            Transaction History
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {summary?.lastTransaction ? (
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                        summary.lastTransaction.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {summary.lastTransaction.type === 'CREDIT' ? '↙' : '↗'}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Last Transaction</p>
                        <p className="font-bold text-slate-800">{summary.lastTransaction.description}</p>
                        <p className="text-sm text-slate-500 font-medium">
                          {new Date(summary.lastTransaction.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-black tracking-tight ${summary.lastTransaction.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {summary.lastTransaction.type === 'CREDIT' ? '+' : '-'}{currencySymbol}{formatCurrencyRaw(summary.lastTransaction.amount || 0, summary?.currency || 'INR').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                        {summary.lastTransaction.status}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                  <div className="text-4xl mb-3 opacity-50">📝</div>
                  <p className="text-slate-500 font-medium">No transactions yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <TransactionHistory userId={userId} refreshTrigger={refreshTrigger} />
            </div>
          )}
        </div>
      </div>

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
          maxAmount={(summary?.balance || 0) / 100}
          userType={isBuyer ? 'buyer' : 'seller'}
        />
      )}
    </div>
  );
};

export default WalletDashboard;
