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
        setError('Failed to load orders');
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80 font-inter text-lg">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md">
            <p className="text-red-400 mb-6 font-inter">{error}</p>
            <button 
              onClick={fetchOrders}
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-inter font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse-glow"></div>
      </div>

      {/* Header */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent font-inter">Buyer Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white/80 font-inter">Welcome, Buyer</span>
              <button
                onClick={() => setShowMyDisputes(true)}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl hover:scale-105 transition-all duration-300 flex items-center shadow-lg font-inter font-medium"
              >
                <span className="mr-2">🚨</span>
                My Disputes
              </button>
              <button
                onClick={() => {
                  console.log('New Order button clicked');
                  console.log('Using window.location.href for navigation');
                  window.location.href = '/buyer/new-order';
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-lg font-inter font-medium cursor-pointer relative z-50"
                style={{ position: 'relative', zIndex: 50 }}
              >
                + New Order
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80 font-inter">Total Orders</p>
                <p className="text-2xl font-bold text-white font-inter">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">📤</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80 font-inter">Pending Review</p>
                <p className="text-2xl font-bold text-white font-inter">
                  {orders.filter(order => order.status === 'SUBMITTED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🚨</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80 font-inter">Disputes</p>
                <p className="text-2xl font-bold text-white font-inter">
                  {orders.filter(order => order.status === 'DISPUTED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80 font-inter">Completed</p>
                <p className="text-2xl font-bold text-white font-inter">
                  {orders.filter(order => order.status === 'RELEASED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
          <div className="px-6 py-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white font-inter">Your Orders</h2>
            </div>
          </div>
          <div className="p-6">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-white/40 text-6xl mb-4 animate-bounce-slow">📋</div>
                <h3 className="text-lg font-semibold text-white mb-2 font-inter">No orders yet</h3>
                <p className="text-white/80 mb-6 font-inter">Start by creating your first order</p>
                <Link
                  to="/buyer/new-order"
                  className="inline-block bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-inter font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Create Order
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