import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buyerData, setBuyerData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('buyerToken');
    const data = localStorage.getItem('buyerData');
    
    if (!token || !data) {
      navigate('/buyer/auth');
      return;
    }

    try {
      setBuyerData(JSON.parse(data));
      fetchOrder(token);
    } catch (error) {
      console.error('Error parsing buyer data:', error);
      navigate('/buyer/auth');
    }
  }, [orderId, navigate]);

  const fetchOrder = async (token) => {
    try {
      const response = await axios.get(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        setError('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      if (error.response?.status === 401) {
        navigate('/buyer/auth');
        return;
      }
      setError(error.response?.data?.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'PLACED': 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      'ESCROW_FUNDED': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      'IN_PROGRESS': 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
      'SUBMITTED': 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      'APPROVED': 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      'DISPUTED': 'bg-red-500/20 text-red-300 border border-red-500/30',
      'RELEASED': 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      'REFUNDED': 'bg-white/20 text-white/80 border border-white/30'
    };
    return colors[status] || 'bg-white/20 text-white/80 border border-white/30';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'PLACED': '📋',
      'ESCROW_FUNDED': '💰',
      'IN_PROGRESS': '⚡',
      'SUBMITTED': '📤',
      'APPROVED': '✅',
      'DISPUTED': '⚠️',
      'RELEASED': '🎉',
      'REFUNDED': '↩️'
    };
    return icons[status] || '📋';
  };

  const getStatusDescription = (status) => {
    const descriptions = {
      'PLACED': 'Order created and waiting for escrow funding',
      'ESCROW_FUNDED': 'Payment secured in escrow, seller notified',
      'IN_PROGRESS': 'Seller is working on your project',
      'SUBMITTED': 'Seller has submitted the delivery for review',
      'APPROVED': 'Delivery approved, funds will be released',
      'DISPUTED': 'Dispute raised, under review',
      'RELEASED': 'Funds released to seller',
      'REFUNDED': 'Funds refunded to buyer'
    };
    return descriptions[status] || 'Unknown status';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price, currency) => {
    if (!price) return 'Not set';
    return `${currency} ${parseFloat(price).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white/80">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-white mb-2">Error Loading Order</h3>
          <p className="text-white/80 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/buyer/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">Order Not Found</h3>
          <p className="text-white/80 mb-4">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <button 
            onClick={() => navigate('/buyer/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/buyer/dashboard')}
            className="flex items-center text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-white">Order Tracking</h1>
          <div className="w-32"></div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Order #{order.id}</h2>
              <p className="text-white/80">Created on {formatDate(order.createdAt)}</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)} {order.status.replace('_', ' ')}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-white mb-3">Order Details</h3>
              <div className="space-y-2 text-sm text-white/90">
                <div><span className="font-medium text-white">Platform:</span> {order.platform}</div>
                <div><span className="font-medium text-white">Product Link:</span> 
                  <a href={order.productLink} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline ml-1">
                    View
                  </a>
                </div>
                <div><span className="font-medium text-white">Country:</span> {order.country}</div>
                <div><span className="font-medium text-white">Currency:</span> {order.currency}</div>
                <div><span className="font-medium text-white">Seller Contact:</span> {order.sellerContact}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Project Details</h3>
              <div className="space-y-2 text-sm text-white/90">
                <div><span className="font-medium text-white">Product Type:</span> {order.scopeBox.productType}</div>
                <div><span className="font-medium text-white">Price:</span> {formatPrice(order.scopeBox.price, order.currency)}</div>
                <div><span className="font-medium text-white">Deadline:</span> {formatDate(order.scopeBox.deadline)}</div>
                <div><span className="font-medium text-white">Condition:</span> {order.scopeBox.condition}</div>
                <div><span className="font-medium text-white">Attachments:</span> {order.scopeBox.attachments?.length || 0} files</div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-white mb-2">Description</h3>
            <p className="text-white/90 bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl">
              {order.scopeBox.description}
            </p>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 mb-8">
          <h3 className="text-lg font-semibold text-white mb-6">Order Timeline</h3>
          
          <div className="space-y-4">
            {order.orderLogs?.map((log, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center">
                    <span className="text-cyan-300 text-sm font-semibold">{index + 1}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">
                    {log.event.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-white/70">
                    {formatDate(log.timestamp)}
                  </div>
                  {log.previousStatus && log.newStatus && (
                    <div className="text-xs text-white/50 mt-1">
                      Status changed from {log.previousStatus} to {log.newStatus}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
          <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.status === 'SUBMITTED' && (
              <button className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg">
                ✅ Approve Delivery
              </button>
            )}
            
            {['PLACED', 'ESCROW_FUNDED', 'IN_PROGRESS', 'SUBMITTED'].includes(order.status) && (
              <button className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg">
                ⚠️ Raise Dispute
              </button>
            )}
            
            <button className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg">
              📧 Contact Seller
            </button>
            
            <button className="w-full px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg">
              📋 Download Invoice
            </button>
          </div>
        </div>

        {/* Status Description */}
        <div className="mt-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">{getStatusIcon(order.status)}</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Current Status: {order.status.replace('_', ' ')}
              </h3>
              <p className="text-white/80">
                {getStatusDescription(order.status)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage; 