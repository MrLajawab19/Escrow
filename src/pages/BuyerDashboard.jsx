import React, { useState, useEffect } from 'react';
import OrderCard from '../components/OrderCard';
import MyDisputesPage from '../components/MyDisputesPage';
import ChangesReviewModal from '../components/ChangesReviewModal';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showMyDisputes, setShowMyDisputes] = useState(false);
  const [showChangesReview, setShowChangesReview] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('buyerToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.get('/api/orders/buyer', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500 font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center p-4">
        <div className="text-center">
          <div className="bg-white border border-neutral-200 shadow-sm rounded-xl p-8 max-w-md w-full">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-2">Error Loading Orders</h3>
            <p className="text-neutral-600 mb-6 text-sm leading-relaxed">{error}</p>
            <button
              onClick={fetchOrders}
              className="btn btn-primary w-full"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-navy-900 tracking-tight">Buyer Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-neutral-500 font-medium hidden sm:inline-block">Welcome back</span>
              <button
                onClick={() => setShowMyDisputes(true)}
                className="btn btn-outline border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              >
                Disputes
              </button>
              <button
                onClick={() => {
                  window.location.href = '/buyer/new-order';
                }}
                className="btn btn-primary shadow-sm hover:shadow"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* My Disputes Modal */}
      {showMyDisputes && (
        <MyDisputesPage
          userType="buyer"
          onClose={() => setShowMyDisputes(false)}
        />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Total Orders</p>
                <p className="text-2xl font-bold text-navy-900 mt-1">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Pending Review</p>
                <p className="text-2xl font-bold text-navy-900 mt-1">
                  {orders.filter(order => order.status === 'SUBMITTED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Disputes</p>
                <p className="text-2xl font-bold text-navy-900 mt-1">
                  {orders.filter(order => order.status === 'DISPUTED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-bold text-navy-900 mt-1">
                  {orders.filter(order => order.status === 'RELEASED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden mt-6">
          <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-navy-900">Your Orders</h2>
          </div>
          <div className="p-6 bg-neutral-50/30">
            {orders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-neutral-100 border-dashed">
                <div className="mx-auto w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-5">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2">No orders yet</h3>
                <p className="text-neutral-500 mb-8 max-w-sm mx-auto leading-relaxed">Start by creating your first order to begin transacting securely with sellers.</p>
                <Link
                  to="/buyer/new-order"
                  className="btn btn-primary"
                >
                  Create Your First Order
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    userType="buyer"
                    onOrderUpdate={handleOrderUpdate}
                    onReviewChanges={handleReviewChanges}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Changes Review Modal */}
      {showChangesReview && selectedOrder && (
        <ChangesReviewModal
          order={selectedOrder}
          onClose={handleChangesReviewClose}
          onUpdate={handleChangesReviewUpdate}
        />
      )}
    </div>
  );
};

export default BuyerDashboard; 