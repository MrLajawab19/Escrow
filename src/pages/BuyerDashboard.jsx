import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import { ClipboardCheck, Clock, Flag, CheckCircle2 } from 'lucide-react';

// Existing modal components (PRESERVED)
import MyDisputesPage from '../components/MyDisputesPage';
import ChangesReviewModal from '../components/ChangesReviewModal';
import WalletDashboard from '../components/WalletDashboard';
import KYCModal from '../components/KYCModal';
import TransactionHistory from '../components/TransactionHistory';

// New dashboard layout components
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import MetricCard from '../components/dashboard/MetricCard';
import DeedsTable from '../components/dashboard/DeedsTable';
import QuickActions from '../components/dashboard/QuickActions';
import WalletOverviewCard from '../components/dashboard/WalletOverviewCard';
import SpendingOverview from '../components/dashboard/SpendingOverview';
import RecentTransactions from '../components/dashboard/RecentTransactions';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showMyDisputes, setShowMyDisputes] = useState(false);
  const [showChangesReview, setShowChangesReview] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userId, setUserId] = useState(null);
  const [kycStatus, setKycStatus] = useState({ phoneVerified: false, kycComplete: false, reviewStatus: 'PENDING' });
  const [showKycModal, setShowKycModal] = useState(false);
  const [walletSummary, setWalletSummary] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [buyerData, setBuyerData] = useState(null);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    // Extract user ID from JWT token
    const token = localStorage.getItem('buyerToken');
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

    // Get buyer data from localStorage
    const storedData = localStorage.getItem('buyerData');
    if (storedData && storedData !== 'undefined') {
      try {
        setBuyerData(JSON.parse(storedData));
      } catch {
        // ignore
      }
    }

    fetchOrders();
    fetchKycStatus();
    fetchWalletSummary();
  }, []);

  const fetchKycStatus = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('buyerToken');
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

  const fetchWalletSummary = async () => {
    try {
      const token = localStorage.getItem('buyerToken');
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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('buyerToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const deedsRes = await axios.get('/api/deeds/buyer', { headers: { Authorization: `Bearer ${token}` } });
      
      let combined = [];

      if (deedsRes.data.success && deedsRes.data.data) {
        const activeDeeds = deedsRes.data.data.filter(d => d.status !== 'DRAFT');
        combined = activeDeeds;
      }

      // Sort combined by creation date descending
      combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setOrders(combined);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please login again.');
      } else {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOrderUpdate = (updatedOrder) => {
    setOrders(prevOrders =>
      prevOrders.map(o =>
        o.id === updatedOrder.id ? updatedOrder : o
      )
    );
  };

  const handleReviewChanges = (order) => {
    setSelectedOrder(order);
    setShowChangesReview(true);
  };

  const handleChangesReviewClose = () => {
    setShowChangesReview(false);
    setSelectedOrder(null);
  };

  const handleChangesReviewUpdate = (updatedOrder) => {
    setOrders(prevOrders =>
      prevOrders.map(o =>
        o.id === updatedOrder.id ? updatedOrder : o
      )
    );
  };

  // Metric computations
  const totalOrders = orders.length;
  const inProgress = orders.filter(o => ['IN_PROGRESS', 'ESCROW_FUNDED', 'ACCEPTED'].includes(o.status)).length;
  const pendingReview = orders.filter(o => o.status === 'SUBMITTED').length;
  const completed = orders.filter(o => o.status === 'RELEASED').length;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500 font-medium text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-white border border-neutral-200 shadow-sm rounded-2xl p-8 max-w-md w-full">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-2">Error Loading Dashboard</h3>
            <p className="text-neutral-600 mb-6 text-sm leading-relaxed">{error}</p>
            <button onClick={fetchOrders} className="btn btn-primary w-full">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <DeedsTable deeds={orders} onViewAllDeeds={() => {}} />
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
                iconBg="bg-primary-50"
                value={totalOrders}
                label="Total Orders"
                subtitle="All time orders"
              />
              <MetricCard
                icon={<Clock size={22} className="text-blue-500" />}
                iconBg="bg-blue-50"
                value={inProgress}
                label="In Progress"
                subtitle="Active orders"
              />
              <MetricCard
                icon={<Flag size={22} className="text-amber-500" />}
                iconBg="bg-amber-50"
                value={pendingReview}
                label="Pending Review"
                subtitle="Awaiting your action"
              />
              <MetricCard
                icon={<CheckCircle2 size={22} className="text-emerald-500" />}
                iconBg="bg-emerald-50"
                value={completed}
                label="Completed"
                subtitle="Successfully done"
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
              {/* Left Column */}
              <div className="lg:col-span-8">
                <DeedsTable
                  deeds={orders}
                  onViewAllDeeds={() => setActiveTab('orders')}
                />
                <QuickActions />
              </div>

              {/* Right Column */}
              <div className="lg:col-span-4">
                <WalletOverviewCard
                  userId={userId}
                  walletSummary={walletSummary}
                  walletLoading={walletLoading}
                  onNavigateToWallet={() => setActiveTab('wallet')}
                  onRefreshWallet={fetchWalletSummary}
                />
                <SpendingOverview 
                  userId={userId} 
                  walletSummary={walletSummary}
                  walletLoading={walletLoading}
                />
                <RecentTransactions
                  userId={userId}
                  onViewAll={() => setActiveTab('wallet')}
                />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewOrder={() => navigate('/buyer/new-order')}
        onDisputesClick={() => setShowMyDisputes(true)}
        userId={buyerData?.id || userId}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <DashboardHeader
          userData={buyerData}
          kycStatus={kycStatus}
          walletBalance={walletSummary?.balance || 0}
          walletLoading={walletLoading}
          onKycClick={() => setShowKycModal(true)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
          {renderContent()}
        </main>
      </div>

      {/* My Disputes Modal */}
      {showMyDisputes && (
        <MyDisputesPage
          userType="buyer"
          onClose={() => setShowMyDisputes(false)}
        />
      )}

      {/* Changes Review Modal */}
      {showChangesReview && selectedOrder && (
        <ChangesReviewModal
          order={selectedOrder}
          onClose={handleChangesReviewClose}
          onUpdate={handleChangesReviewUpdate}
        />
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

export default BuyerDashboard;