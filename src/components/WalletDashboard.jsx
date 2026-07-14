import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useCurrency } from '../context/CurrencyContext';

// Modals
import TopUpModal from './TopUpModal';
import WithdrawalModal from './WithdrawalModal';

// New Premium Components
import WalletHeader from './wallet/WalletHeader';
import WalletHeroCard from './wallet/WalletHeroCard';
import WalletInsights from './wallet/WalletInsights';
import QuickActions from './wallet/QuickActions';
import SpendingDonut from './wallet/SpendingDonut';
import PaymentMethods from './wallet/PaymentMethods';
import TransactionTable from './wallet/TransactionTable';
import LedgerTimeline from './wallet/LedgerTimeline';

const WalletDashboard = ({ userId }) => {
  // Single Source of Truth State
  const [walletSummary, setWalletSummary] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState(null);
  const [buyerData, setBuyerData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactionsCount, setTotalTransactionsCount] = useState(0);
  const [filters, setFilters] = useState({ category: '', type: '', status: '' });
  const transactionsPerPage = 10;

  // Modals
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  // Fetch Wallet Summary
  useEffect(() => {
    const fetchWalletSummary = async () => {
      try {
        setWalletLoading(true);
        const token = localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken');
        if (!token) return;
        
        // Also grab buyer data for header avatar
        const storedData = localStorage.getItem('buyerData');
        if (storedData && storedData !== 'undefined') {
          try { setBuyerData(JSON.parse(storedData)); } catch { /* ignore */ }
        }

        const summaryResponse = await axios.get('/api/wallet/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setWalletSummary(summaryResponse.data.data);
        setWalletError(null);
      } catch (err) {
        setWalletError(err.response?.data?.message || 'Failed to load wallet summary');
      } finally {
        setWalletLoading(false);
      }
    };

    fetchWalletSummary();
  }, [userId, refreshTrigger]);

  // Fetch Transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setTransactionsLoading(true);
        const token = localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken');
        if (!token) return;

        const params = {
          limit: transactionsPerPage,
          offset: (currentPage - 1) * transactionsPerPage,
        };
        if (filters.category) params.category = filters.category;
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;

        const response = await axios.get('/api/wallet/transactions', { 
          params,
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setTransactions(response.data.data.transactions);
        setTotalTransactionsCount(response.data.data.total);
        setTransactionsError(null);
      } catch (err) {
        setTransactionsError(err.response?.data?.message || 'Failed to load transactions');
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchTransactions();
  }, [userId, currentPage, filters, refreshTrigger]);

  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const totalPages = Math.ceil(totalTransactionsCount / transactionsPerPage);
  const isBuyer = walletSummary?.userRole === 'buyer' || !!localStorage.getItem('buyerToken');

  return (
    <div className="w-full bg-neutral-50 min-h-screen pb-12 font-inter animate-fadeIn">
      {walletError && (
        <div className="mb-6 p-4 bg-red-50/80 border border-red-200 rounded-2xl text-red-700 shadow-sm flex items-center gap-3">
          <span className="text-xl">⚠️</span> {walletError}
        </div>
      )}

      {/* Header Section */}
      <WalletHeader 
        buyerData={buyerData}
        onNotificationClick={() => {}} 
        onProfileClick={() => {}} 
      />

      {/* Main Content Layout */}
      <div className="space-y-6">
        {/* Top Fold: Hero & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <WalletHeroCard 
              walletSummary={walletSummary} 
              isBuyer={isBuyer} 
            />
            <QuickActions 
              onAddFunds={() => setShowTopUpModal(true)}
              onWithdraw={() => setShowWithdrawalModal(true)}
              onPaymentMethods={() => {}}
              onViewLedger={() => {}}
            />
          </div>
          <div className="lg:col-span-4">
            <SpendingDonut 
              walletSummary={walletSummary} 
              walletLoading={walletLoading} 
            />
          </div>
        </div>

        {/* Middle Fold: Insights Row */}
        <WalletInsights 
          walletSummary={walletSummary} 
          walletLoading={walletLoading} 
        />

        {/* Bottom Fold: Tables & Secondary Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <TransactionTable 
              transactions={transactions}
              loading={transactionsLoading}
              error={transactionsError}
              filters={filters}
              onFilterChange={handleFilterChange}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalTransactions={totalTransactionsCount}
            />
          </div>
          
          <div className="lg:col-span-4 space-y-6">
            <PaymentMethods />
            <LedgerTimeline 
              transactions={transactions} 
              loading={transactionsLoading} 
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTopUpModal && (
        <TopUpModal
          isOpen={showTopUpModal}
          onClose={() => setShowTopUpModal(false)}
          onSuccess={() => { setShowTopUpModal(false); triggerRefresh(); }}
        />
      )}
      
      {showWithdrawalModal && (
        <WithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          onSuccess={() => { setShowWithdrawalModal(false); triggerRefresh(); }}
          maxAmount={(walletSummary?.balance || 0) / 100}
          userType={isBuyer ? "buyer" : "seller"}
        />
      )}
    </div>
  );
};

export default WalletDashboard;
