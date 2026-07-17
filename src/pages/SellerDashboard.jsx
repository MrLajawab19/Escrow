import React, { useState, useEffect } from 'react';
import MyDisputesPage from '../components/MyDisputesPage';
import NotificationModal from '../components/NotificationModal';
import OrderChat from '../components/order/OrderChat'; // ← Real-time order chat
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
import { ClipboardCheck, Clock, Flag, AlertTriangle } from 'lucide-react';

const inputClass = "w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter text-sm shadow-sm";
const labelClass = "block text-sm font-medium mb-1.5 text-navy-900 font-inter";

const SellerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRequests, setShowRequests] = useState(false);
  const [scopeBoxOrder, setScopeBoxOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showRequestChanges, setShowRequestChanges] = useState(false);
  const [requestChangesOrder, setRequestChangesOrder] = useState(null);
  const [modifiedScopeBox, setModifiedScopeBox] = useState(null);
  const [showMyDisputes, setShowMyDisputes] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [notification, setNotification] = useState({ isOpen: false, title: '', message: '', type: 'success' });
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

  const handleOrderUpdate = (updatedOrder) => {
    setOrders(prevOrders => prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    if (selectedOrder?.id === updatedOrder.id) {
      setSelectedOrder(updatedOrder);
    }
  };

  const handleAcceptOrder = async (order) => {
    try {
      const token = localStorage.getItem('sellerToken');
      if (!token) { setNotification({ isOpen: true, title: 'Auth Required', message: 'Please login.', type: 'error' }); return; }
      
      const response = await axios.patch(`/api/orders/${order.id}/accept`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        const updatedOrder = { ...order, status: 'ACCEPTED' };
        setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
        setScopeBoxOrder(null);
        setShowRequests(false);
        setSelectedOrder(updatedOrder);
        setNotification({ isOpen: true, title: 'Success', message: 'Order accepted!', type: 'success' });
      } else {
        setNotification({ isOpen: true, title: 'Error', message: 'Failed: ' + response.data.message, type: 'error' });
      }
    } catch (error) {
      setNotification({ isOpen: true, title: 'Error', message: 'Error accepting order.', type: 'error' });
    }
  };

  const handleRejectOrder = async (order) => {
    try {
      const token = localStorage.getItem('sellerToken');
      if (!token) { setNotification({ isOpen: true, title: 'Auth Required', message: 'Please login.', type: 'error' }); return; }
      
      if (order.status === 'ACTIVE' || order.status === 'IN_PROGRESS') {
        setNotification({ isOpen: true, title: 'Not Allowed', message: 'Order is active. Please use Dispute flow to walk away.', type: 'error' });
        return;
      }

      const targetId = order.scopeBox?.deedId || order.id;
      const response = await axios.post(`/api/deeds/${targetId}/reject`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        const updatedOrder = { ...order, status: 'REJECTED' };
        setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
        setScopeBoxOrder(null);
        setShowRequests(false);
        setSelectedOrder(updatedOrder);
        setNotification({ isOpen: true, title: 'Success', message: 'Order rejected.', type: 'success' });
      } else {
        setNotification({ isOpen: true, title: 'Error', message: 'Failed: ' + response.data.message, type: 'error' });
      }
    } catch (error) {
      setNotification({ isOpen: true, title: 'Error', message: 'Error rejecting order.', type: 'error' });
    }
  };

  const handleRequestChanges = (order) => {
    setRequestChangesOrder(order);
    setModifiedScopeBox({
      ...order.scopeBox,
      price: (order.scopeBox?.price || 0) / 100,
      changesRequested: true,
      requestedBy: 'seller',
      requestedAt: new Date().toISOString()
    });
    setShowRequestChanges(true);
  };

  const handleScopeBoxChange = (field, value) => {
    setModifiedScopeBox(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitChanges = async () => {
    try {
      const token = localStorage.getItem('sellerToken');
      if (!token) { setNotification({ isOpen: true, title: 'Auth Required', message: 'Please login.', type: 'error' }); return; }
      const payloadScopeBox = {
        ...modifiedScopeBox,
        price: Math.round(parseFloat(modifiedScopeBox.price || 0) * 100)
      };
      const response = await axios.patch(`/api/orders/${requestChangesOrder.id}/request-changes`, {
        scopeBox: payloadScopeBox,
        changesRequested: true
      }, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.data.success) {
        const updatedOrder = { ...requestChangesOrder, scopeBox: modifiedScopeBox, status: 'CHANGES_REQUESTED', updatedAt: new Date().toISOString() };
        setOrders(prev => prev.map(o => o.id === requestChangesOrder.id ? updatedOrder : o));
        setShowRequestChanges(false);
        setRequestChangesOrder(null);
        setModifiedScopeBox(null);
        setScopeBoxOrder(null);
        setShowRequests(false);
        setSelectedOrder(updatedOrder);
        setNotification({ isOpen: true, title: 'Success', message: 'Changes requested successfully!', type: 'success' });
      } else {
        setNotification({ isOpen: true, title: 'Error', message: 'Failed: ' + response.data.message, type: 'error' });
      }
    } catch (error) {
      setNotification({ isOpen: true, title: 'Error', message: 'Error requesting changes.', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500 font-inter font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center p-4">
        <div className="bg-white border border-neutral-200 shadow-sm rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-navy-900 mb-2 font-inter">Error Loading Orders</h3>
          <p className="text-neutral-600 mb-6 text-sm font-inter">{error}</p>
          <button onClick={fetchOrders} className="w-full py-3 px-4 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 shadow-md font-inter text-sm">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Metric computations
  const totalOrders = orders.length;
  const inProgress = orders.filter(o => ['IN_PROGRESS', 'ACCEPTED'].includes(o.status)).length;
  const pendingReview = orders.filter(o => o.status === 'SUBMITTED').length;
  const totalEarnings = orders.filter(o => !['REJECTED', 'CANCELLED', 'REFUNDED', 'PLACED'].includes(o.status)).reduce((sum, o) => sum + (o.scopeBox?.price || 0), 0);

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
                icon={<span className="text-lg font-bold text-emerald-500">₹</span>}
                iconBg="bg-emerald-50"
                value={formatCurrency(totalEarnings, 'INR')}
                label="Earnings"
                subtitle="Total revenue"
                valueClass="text-xl"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
              {/* Left Column: Orders & Quick Actions */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Pending Requests Banner */}
                {orders.filter(o => o.status === 'ESCROW_FUNDED').length > 0 && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                        <AlertTriangle size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-navy-900">You have new order requests</h3>
                        <p className="text-sm text-neutral-600">Review and accept to start working.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowRequests(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
                    >
                      View Requests
                    </button>
                  </div>
                )}
                
                <DeedsTable deeds={orders} onViewAllDeeds={() => setActiveTab('orders')} userType="seller" />
                
                {/* Invite Link Form */}
                <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6">
                  <h3 className="text-base font-bold text-navy-900 mb-2">Have an invite code?</h3>
                  <p className="text-sm text-neutral-500 mb-4">Paste the link or code below to accept an order directly.</p>
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
                      className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                  transactions={walletSummary?.recentTransactions || []}
                  loading={walletLoading}
                  userType="seller"
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
    <div className="flex h-screen bg-neutral-50 overflow-hidden font-inter">
      {/* Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewOrder={() => setShowRequests(true)}
        userType="seller"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <DashboardHeader
          userData={sellerData}
          kycStatus={kycStatus}
          walletBalance={walletSummary?.balance || 0}
          walletLoading={walletLoading}
          onKycClick={() => setShowKycModal(true)}
          userType="seller"
          onDisputesClick={() => setShowMyDisputes(true)}
          onViewRequestsClick={() => setShowRequests(true)}
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

      {/* Requests Modal */}
      {showRequests && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xl max-w-4xl w-full p-8 relative max-h-[85vh] overflow-y-auto mx-4">
            <button className="absolute top-4 right-5 text-neutral-400 hover:text-neutral-700 text-2xl transition-colors" onClick={() => setShowRequests(false)}>×</button>
            <h2 className="text-xl font-bold mb-6 text-navy-900 font-inter">Order Requests</h2>
            {orders.filter(o => o.status === 'ESCROW_FUNDED').length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-neutral-600 font-inter font-medium mb-1">No pending order requests</p>
                <p className="text-sm text-neutral-400 font-inter">New orders from buyers will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.filter(o => o.status === 'ESCROW_FUNDED').map(order => (
                  <div key={order.id} className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-semibold text-navy-900 font-inter mb-1">{order.scopeBox?.title || 'Untitled Order'}</div>
                        <div className="text-sm text-neutral-500 font-inter mb-2">From: {order.buyerName || 'Unknown Buyer'}</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                          <div><span className="text-neutral-400 font-inter">Deadline: </span><span className="font-medium text-navy-900 font-inter">{order.scopeBox?.deadline ? new Date(order.scopeBox.deadline).toLocaleDateString() : 'N/A'}</span></div>
                          <div><span className="text-neutral-400 font-inter">Price: </span><span className="font-medium text-navy-900 font-inter">{formatCurrency(order.scopeBox?.price || 0, order.currency || 'INR')}</span></div>
                          <div><span className="text-neutral-400 font-inter">Platform: </span><span className="font-medium text-navy-900 font-inter">{order.platform || 'N/A'}</span></div>
                        </div>
                        {order.scopeBox?.description && (
                          <p className="text-sm text-neutral-500 font-inter mt-2 line-clamp-2">{order.scopeBox.description.substring(0, 100)}...</p>
                        )}
                      </div>
                      <button
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm font-inter whitespace-nowrap"
                        onClick={() => setScopeBoxOrder(order)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scope Box Modal */}
      {scopeBoxOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative mx-4">
            <button className="absolute top-4 right-5 text-neutral-400 hover:text-neutral-700 text-2xl transition-colors" onClick={() => setScopeBoxOrder(null)}>×</button>
            <h2 className="text-xl font-bold mb-6 text-navy-900 font-inter">Scope Box Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <span className="font-medium text-neutral-500 font-inter">Title</span>
                <span className="font-semibold text-navy-900 font-inter text-right">{scopeBoxOrder.scopeBox?.title}</span>
              </div>
              <div className="py-2 border-b border-neutral-100">
                <span className="font-medium text-neutral-500 font-inter block mb-1">Description</span>
                <p className="text-navy-900 font-inter">{scopeBoxOrder.scopeBox?.description}</p>
              </div>
              <div className="py-2 border-b border-neutral-100">
                <span className="font-medium text-neutral-500 font-inter block mb-1">Deliverables</span>
                <ul className="list-disc ml-4 text-navy-900 font-inter space-y-1">
                  {(scopeBoxOrder.scopeBox?.deliverables || []).map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <span className="font-medium text-neutral-500 font-inter">Deadline</span>
                <span className="font-semibold text-navy-900 font-inter">{scopeBoxOrder.scopeBox?.deadline ? new Date(scopeBoxOrder.scopeBox.deadline).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <span className="font-medium text-neutral-500 font-inter">Price</span>
                <span className="font-bold text-navy-900 font-inter">{formatCurrency(scopeBoxOrder.scopeBox?.price || 0, scopeBoxOrder.currency || 'INR')}</span>
              </div>
              {scopeBoxOrder.scopeBox?.attachments?.length > 0 && (
                <div className="py-2">
                  <span className="font-medium text-neutral-500 font-inter block mb-2">Attachments</span>
                  <div className="flex flex-wrap gap-2">
                    {scopeBoxOrder.scopeBox.attachments.map((file, idx) => {
                      const ext = file.split('.').pop().toLowerCase();
                      if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) {
                        return <img key={idx} src={file} alt="attachment" className="w-16 h-16 object-cover rounded-lg border border-neutral-200" />;
                      } else if (["mp4", "webm", "ogg"].includes(ext)) {
                        return <video key={idx} src={file} controls className="w-24 h-16 rounded-lg border border-neutral-200" />;
                      } else {
                        return <a key={idx} href={file} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline text-sm font-inter">{file.split('/').pop()}</a>;
                      }
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
              {(!scopeBoxOrder.status || scopeBoxOrder.status === 'PLACED' || scopeBoxOrder.status === 'ESCROW_FUNDED') && (
                <>
                  <button className="px-5 py-2.5 bg-emerald-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm font-inter" onClick={() => handleAcceptOrder(scopeBoxOrder)}>✓ Accept</button>
                  <button className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm font-inter" onClick={() => handleRejectOrder(scopeBoxOrder)}>✕ Reject</button>
                  <button className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm font-inter" onClick={() => handleRequestChanges(scopeBoxOrder)}>✎ Request Changes</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xl max-w-4xl w-full p-8 relative mx-4">
            <button className="absolute top-4 right-5 text-neutral-400 hover:text-neutral-700 text-2xl transition-colors" onClick={() => setSelectedOrder(null)}>×</button>
            <h2 className="text-xl font-bold mb-6 text-navy-900 font-inter">Order Details — {selectedOrder.scopeBox?.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-base font-semibold mb-3 text-navy-900 font-inter">Order Information</h3>
                <div className="space-y-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                  <div className="flex justify-between py-1.5 border-b border-neutral-100"><span className="text-neutral-500 font-inter">Order ID</span><span className="font-medium text-navy-900 font-inter">{selectedOrder.id}</span></div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100">
                    <span className="text-neutral-500 font-inter">Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-inter ${selectedOrder.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        selectedOrder.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' :
                          selectedOrder.status === 'CHANGES_REQUESTED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-neutral-100 text-neutral-600 border border-neutral-200'
                      }`}>{selectedOrder.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100"><span className="text-neutral-500 font-inter">Price</span><span className="font-bold text-navy-900 font-inter">{formatCurrency(selectedOrder.scopeBox?.price || 0, selectedOrder.currency || 'INR')}</span></div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100"><span className="text-neutral-500 font-inter">Deadline</span><span className="font-medium text-navy-900 font-inter">{selectedOrder.scopeBox?.deadline ? new Date(selectedOrder.scopeBox.deadline).toLocaleDateString() : 'No deadline'}</span></div>
                  <div className="flex justify-between py-1.5"><span className="text-neutral-500 font-inter">Updated</span><span className="font-medium text-navy-900 font-inter">{new Date(selectedOrder.updatedAt).toLocaleString()}</span></div>
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold mb-3 text-navy-900 font-inter">Scope Details</h3>
                <div className="space-y-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                  <div className="py-1.5 border-b border-neutral-100"><span className="text-neutral-500 font-inter">Description</span><p className="mt-1 text-navy-900 font-inter leading-relaxed">{selectedOrder.scopeBox?.description}</p></div>
                  <div className="py-1.5">
                    <span className="text-neutral-500 font-inter">Deliverables</span>
                    <ul className="mt-1 space-y-1">
                      {selectedOrder.scopeBox?.deliverables?.map((item, i) => (
                        <li key={i} className="text-sm text-navy-900 font-inter flex items-start gap-1.5"><span className="text-indigo-600 mt-0.5">•</span>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-between items-center pt-4 border-t border-neutral-100">
              <button onClick={() => setSelectedOrder(null)} className="px-5 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-navy-900 rounded-xl text-sm font-semibold transition-colors font-inter">
                ← Back to Orders
              </button>
              <div className={`text-sm font-inter font-medium px-3 py-1.5 rounded-full ${selectedOrder.status === 'IN_PROGRESS' ? 'text-indigo-700 bg-indigo-50' :
                  selectedOrder.status === 'REJECTED' ? 'text-red-700 bg-red-50' :
                    selectedOrder.status === 'CHANGES_REQUESTED' ? 'text-amber-700 bg-amber-50' :
                      'text-neutral-600 bg-neutral-100'
                }`}>
                {selectedOrder.status === 'IN_PROGRESS' ? '✅ Order in progress — use Mark as Delivered on the order card when work is ready.' :
                  selectedOrder.status === 'REJECTED' ? '❌ Order rejected' :
                    selectedOrder.status === 'CHANGES_REQUESTED' ? '✎ Changes requested — awaiting buyer' :
                      'Order updated'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {showRequestChanges && requestChangesOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xl max-w-4xl w-full p-8 relative max-h-[90vh] overflow-y-auto mx-4">
            <button className="absolute top-4 right-5 text-neutral-400 hover:text-neutral-700 text-2xl transition-colors" onClick={() => setShowRequestChanges(false)}>×</button>
            <h2 className="text-xl font-bold mb-6 text-navy-900 font-inter">Request Changes to Scope Box</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
                <h3 className="font-semibold text-navy-900 mb-4 font-inter text-sm uppercase tracking-wide">Original Scope Box</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium text-neutral-500 font-inter">Title: </span><span className="text-navy-900 font-inter">{requestChangesOrder.scopeBox?.title}</span></div>
                  <div><span className="font-medium text-neutral-500 font-inter">Description: </span><span className="text-navy-900 font-inter">{requestChangesOrder.scopeBox?.description}</span></div>
                  <div><span className="font-medium text-neutral-500 font-inter">Product Type: </span><span className="text-navy-900 font-inter">{requestChangesOrder.scopeBox?.productType}</span></div>
                  <div><span className="font-medium text-neutral-500 font-inter">Price: </span><span className="text-navy-900 font-inter font-bold">{formatCurrency(requestChangesOrder.scopeBox?.price || 0, requestChangesOrder.currency || 'INR')}</span></div>
                  <div><span className="font-medium text-neutral-500 font-inter">Deadline: </span><span className="text-navy-900 font-inter">{requestChangesOrder.scopeBox?.deadline ? new Date(requestChangesOrder.scopeBox.deadline).toLocaleDateString() : 'N/A'}</span></div>
                  <div>
                    <span className="font-medium text-neutral-500 font-inter">Deliverables:</span>
                    <ul className="list-disc ml-4 mt-1 space-y-1">
                      {(requestChangesOrder.scopeBox?.deliverables || []).map((d, i) => <li key={i} className="text-navy-900 font-inter">{d}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Proposed Changes */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                <h3 className="font-semibold text-indigo-700 mb-4 font-inter text-sm uppercase tracking-wide">Proposed Changes</h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Title</label>
                    <input type="text" value={modifiedScopeBox?.title || ''} onChange={e => handleScopeBoxChange('title', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea value={modifiedScopeBox?.description || ''} onChange={e => handleScopeBoxChange('description', e.target.value)} rows={3} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Product Type</label>
                    <input type="text" value={modifiedScopeBox?.productType || ''} onChange={e => handleScopeBoxChange('productType', e.target.value)} className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Price ({currency})</label>
                      <input type="number" value={modifiedScopeBox?.price || ''} onChange={e => handleScopeBoxChange('price', parseFloat(e.target.value))} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Deadline</label>
                      <input type="date" value={modifiedScopeBox?.deadline ? new Date(modifiedScopeBox.deadline).toISOString().split('T')[0] : ''} onChange={e => handleScopeBoxChange('deadline', e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Deliverables (comma-separated)</label>
                    <input type="text" value={modifiedScopeBox?.deliverables?.join(', ') || ''} onChange={e => handleScopeBoxChange('deliverables', e.target.value.split(',').map(d => d.trim()))} className={inputClass} placeholder="Logo PNG, Logo SVG, Brand guidelines" />
                  </div>
                  <div>
                    <label className={labelClass}>Reason for Changes</label>
                    <textarea value={modifiedScopeBox?.changeReason || ''} onChange={e => handleScopeBoxChange('changeReason', e.target.value)} rows={2} className={inputClass} placeholder="Explain why these changes are needed..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
              <button className="px-5 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-navy-900 rounded-xl text-sm font-semibold transition-colors font-inter" onClick={() => setShowRequestChanges(false)}>Cancel</button>
              <button className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm font-inter" onClick={handleSubmitChanges}>Submit Changes Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />

      {/* Order Chat (floating bubble for selected order) */}
      {selectedOrder && sellerUser && (
        <OrderChat
          orderId={selectedOrder.id}
          currentUser={sellerUser}
          orderStatus={selectedOrder.status}
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

export default SellerDashboard;