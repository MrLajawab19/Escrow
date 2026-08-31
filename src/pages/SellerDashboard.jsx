import React, { useState, useEffect } from 'react';
import MyDisputesPage from '../components/MyDisputesPage';

import WalletDashboard from '../components/WalletDashboard';
import KYCModal from '../components/KYCModal';
import axios from 'axios';
import { useCurrency } from '../context/CurrencyContext';
import { useNavigate } from 'react-router-dom';

// New dashboard layout components
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import MetricCard from '../components/dashboard/MetricCard';
import DeedsTable from '../components/dashboard/DeedsTable';
import WalletOverviewCard from '../components/dashboard/WalletOverviewCard';
import SpendingOverview from '../components/dashboard/SpendingOverview';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import { ClipboardCheck, Clock, Flag } from 'lucide-react';

const SellerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMyDisputes, setShowMyDisputes] = useState(false);

  const [userId, setUserId] = useState(null);
  const [kycStatus, setKycStatus] = useState({ phoneVerified: false, kycComplete: false, reviewStatus: 'PENDING' });
  const [showKycModal, setShowKycModal] = useState(false);
  const [inviteLinkInput, setInviteLinkInput] = useState('');
  const [walletSummary, setWalletSummary] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [sellerData, setSellerData] = useState(null);
  const navigate = useNavigate();

  const { formatCurrency, currency } = useCurrency();

  // Decode seller identity from JWT (for OrderChat currentUser prop)
  const getSellerUser = () => {
    try {
      const token = localStorage.getItem('sellerToken');
      if (!token || token === 'undefined') return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      const id = payload.userId || payload.id;
      return { userId: id, role: 'seller', firstName: payload.firstName, lastName: payload.lastName, profileImage: payload.profileImage };
    } catch { return null; }
  };
  const sellerUser = getSellerUser();

  useEffect(() => {
    // Extract user ID from JWT token
    const token = localStorage.getItem('sellerToken');
    if (token && token !== 'undefined') {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(atob(parts[1]));
          setUserId(decoded.userId || decoded.id);
        }
      } catch (err) {
        console.error('Failed to decode token:', err);
      }
    }

    // Get seller data from localStorage
    const storedData = localStorage.getItem('sellerData');
    if (storedData && storedData !== 'undefined') {
      try {
        setSellerData(JSON.parse(storedData));
      } catch {
        // ignore
      }
    } else if (sellerUser) {
        setSellerData(sellerUser);
    }
    fetchOrders();
    fetchKycStatus();
    fetchWalletSummary();

    const onFocus = () => {
      fetchOrders();
      fetchWalletSummary();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const fetchWalletSummary = async () => {
    try {
      const token = localStorage.getItem('sellerToken');
      if (!token) return;
      const response = await axios.get('/api/wallet/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWalletSummary(response.data.data);
    } catch (err) {
      // silent
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchKycStatus = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('sellerToken');
      if (!token) return;
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/kyc/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setKycStatus(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch KYC status', err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('sellerToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.get('/api/deeds/seller', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please login again.');
      } else {
        setError(err.response?.data?.message || 'Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] dark:bg-dark-bg dark:bg-dark-bg flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500 dark:text-dark-muted font-inter font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] dark:bg-dark-bg dark:bg-dark-bg flex items-center justify-center p-4 transition-colors">
        <div className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border shadow-sm rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-navy-900 dark:text-dark-primary mb-2 font-inter">Error Loading Orders</h3>
          <p className="text-neutral-600 dark:text-dark-muted mb-6 text-sm font-inter">{error}</p>
          <button onClick={fetchOrders} className="w-full py-3 px-4 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 shadow-md font-inter text-sm">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Metric computations
  const totalOrders = orders.length;
  const inProgress = orders.filter(o => ['PENDING_SELLER', 'ACTIVE', 'IN_PROGRESS'].includes(o.status)).length;
  const pendingReview = orders.filter(o => o.status === 'SUBMITTED').length;
  const totalEarnings = walletSummary?.lifetimeEarnings || 0;

  // Render tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'wallet':
      case 'transactions':
      case 'refunds':
        return (
          <div className="animate-fadeIn">
            {userId && <WalletDashboard userId={userId} />}
          </div>
        );

      case 'orders':
        return (
          <div className="animate-fadeIn">
            <DeedsTable deeds={orders} onViewAllDeeds={() => {}} userType="seller" />
          </div>
        );

      case 'dashboard':
      default:
        return (
          <div className="animate-fadeIn">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricCard
                icon={<ClipboardCheck size={22} className="text-primary-500" />}
                iconBg="bg-primary-50 dark:bg-primary-900/30"
                value={totalOrders}
                label="Total Orders"
                subtitle="All time orders"
              />
              <MetricCard
                icon={<Clock size={22} className="text-blue-500" />}
                iconBg="bg-blue-50 dark:bg-blue-900/30"
                value={inProgress}
                label="In Progress"
                subtitle="Active orders"
              />
              <MetricCard
                icon={<Flag size={22} className="text-amber-500" />}
                iconBg="bg-amber-50 dark:bg-amber-900/30"
                value={pendingReview}
                label="Pending Review"
                subtitle="Awaiting your action"
              />
              <MetricCard
                icon={<span className="text-lg font-bold text-emerald-500">₹</span>}
                iconBg="bg-emerald-50 dark:bg-emerald-900/30"
                value={formatCurrency(totalEarnings, 'INR')}
                label="Earnings"
                subtitle="Total revenue"
                valueClass="text-xl"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
              {/* Left Column: Orders & Quick Actions */}
              <div className="lg:col-span-8 space-y-6">
                

                <DeedsTable deeds={orders} onViewAllDeeds={() => setActiveTab('orders')} userType="seller" />
                
                {/* Invite Link Form */}
                <div className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-2xl shadow-sm p-6">
                  <h3 className="text-base font-bold text-navy-900 mb-2">Have an invite code?</h3>
                  <p className="text-sm text-neutral-500 dark:text-dark-muted mb-4">Paste the link or code below to accept an order directly.</p>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!inviteLinkInput.trim()) return;
                    const token = inviteLinkInput.trim().split('/').pop();
                    if (token) navigate(`/deed/invite/${token}`);
                  }} className="flex items-center gap-3 w-full">
                    <input 
                      type="text" 
                      value={inviteLinkInput}
                      onChange={(e) => setInviteLinkInput(e.target.value)}
                      placeholder="Paste Invite Link or Token..." 
                      className="flex-1 px-4 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-neutral-50 focus:bg-white dark:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <button 
                      type="submit"
                      className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm whitespace-nowrap"
                    >
                      Open Invite
                    </button>
                  </form>
                </div>
                
              </div>

              {/* Right Column: Wallet & Recent */}
              <div className="lg:col-span-4 space-y-6">
                <WalletOverviewCard
                  userId={userId}
                  walletSummary={walletSummary}
                  walletLoading={walletLoading}
                  onNavigateToWallet={() => setActiveTab('wallet')}
                  onRefreshWallet={fetchWalletSummary}
                  userType="seller"
                />
                <SpendingOverview
                  userId={userId}
                  walletSummary={walletSummary}
                  walletLoading={walletLoading}
                />
                <RecentTransactions
                  transactions={walletSummary?.recentTransactions || []}
                  loading={walletLoading}
                  onViewAll={() => setActiveTab('transactions')}
                />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-dark-bg overflow-hidden font-inter transition-colors">
      {/* Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}

        userType="seller"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <DashboardHeader
          userData={sellerData}
          kycStatus={kycStatus}
          walletBalance={walletSummary?.balance || 0}
          walletCurrency={walletSummary?.currency}
          walletLoading={walletLoading}
          onKycClick={() => setShowKycModal(true)}
          userType="seller"
          onDisputesClick={() => setShowMyDisputes(true)}

        />

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
          {renderContent()}
        </main>
      </div>

      {/* Existing Modals */}
      {showMyDisputes && (
        <MyDisputesPage userType="seller" onClose={() => setShowMyDisputes(false)} />
      )}



      {/* KYC Modal */}
      <KYCModal 
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        onComplete={fetchKycStatus}
      />

    </div>
  );
};

export default SellerDashboard;