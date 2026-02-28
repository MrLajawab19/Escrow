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
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        setError('Failed to fetch order details');
      }
    } catch (error) {
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
      'PLACED': 'bg-blue-50 text-blue-700 border border-blue-200',
      'ESCROW_FUNDED': 'bg-amber-50 text-amber-700 border border-amber-200',
      'IN_PROGRESS': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      'SUBMITTED': 'bg-purple-50 text-purple-700 border border-purple-200',
      'APPROVED': 'bg-green-50 text-green-700 border border-green-200',
      'DISPUTED': 'bg-red-50 text-red-700 border border-red-200',
      'RELEASED': 'bg-green-50 text-green-700 border border-green-200',
      'REFUNDED': 'bg-neutral-100 text-neutral-600 border border-neutral-200'
    };
    return colors[status] || 'bg-neutral-100 text-neutral-600 border border-neutral-200';
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
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatPrice = (price, currency) => {
    if (!price) return 'Not set';
    return `${currency} ${parseFloat(price).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500 font-inter">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h3 className="text-xl font-bold text-[#0A2540] font-inter mb-2">Error Loading Order</h3>
          <p className="text-neutral-500 font-inter mb-6">{error}</p>
          <button
            onClick={() => navigate('/buyer/dashboard')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all duration-200 shadow-md font-inter"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔍</span>
          </div>
          <h3 className="text-xl font-bold text-[#0A2540] font-inter mb-2">Order Not Found</h3>
          <p className="text-neutral-500 font-inter mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => navigate('/buyer/dashboard')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all duration-200 shadow-md font-inter"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F9FC] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/buyer/dashboard')}
            className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors font-inter"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-[#0A2540] font-inter">Order Tracking</h1>
          <div className="w-32"></div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#0A2540] font-inter">Order #{order.id}</h2>
              <p className="text-sm text-neutral-500 font-inter mt-1">Created on {formatDate(order.createdAt)}</p>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-sm font-semibold font-inter ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)} {order.status.replace(/_/g, ' ')}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-[#0A2540] font-inter mb-3">Order Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500 font-inter">Platform</span>
                  <span className="font-medium text-[#0A2540] font-inter">{order.platform}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500 font-inter">Seller Link</span>
                  <a href={order.productLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 font-inter font-medium">
                    View Profile
                  </a>
                </div>
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500 font-inter">Country</span>
                  <span className="font-medium text-[#0A2540] font-inter">{order.country}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500 font-inter">Currency</span>
                  <span className="font-medium text-[#0A2540] font-inter">{order.currency}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-neutral-500 font-inter">Seller Contact</span>
                  <span className="font-medium text-[#0A2540] font-inter">{order.sellerContact}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-[#0A2540] font-inter mb-3">Project Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500 font-inter">Product Type</span>
                  <span className="font-medium text-[#0A2540] font-inter">{order.scopeBox.productType}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500 font-inter">Price</span>
                  <span className="font-bold text-[#0A2540] font-inter">{formatPrice(order.scopeBox.price, order.currency)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500 font-inter">Deadline</span>
                  <span className="font-medium text-[#0A2540] font-inter">{formatDate(order.scopeBox.deadline)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500 font-inter">Condition</span>
                  <span className="font-medium text-[#0A2540] font-inter">{order.scopeBox.condition}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-neutral-500 font-inter">Attachments</span>
                  <span className="font-medium text-[#0A2540] font-inter">{order.scopeBox.attachments?.length || 0} files</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-neutral-100">
            <h3 className="font-semibold text-[#0A2540] font-inter mb-2">Description</h3>
            <p className="text-sm text-neutral-600 font-inter bg-neutral-50 border border-neutral-200 p-4 rounded-xl leading-relaxed">
              {order.scopeBox.description}
            </p>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-8 mb-6">
          <h3 className="text-lg font-semibold text-[#0A2540] font-inter mb-6">Order Timeline</h3>
          <div className="space-y-4">
            {order.orderLogs?.map((log, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-50 border border-indigo-200 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 text-sm font-semibold font-inter">{index + 1}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="text-sm font-semibold text-[#0A2540] font-inter">
                    {log.event.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-neutral-500 font-inter mt-0.5">
                    {formatDate(log.timestamp)}
                  </div>
                  {log.previousStatus && log.newStatus && (
                    <div className="text-xs text-neutral-400 mt-1 font-inter">
                      Status changed from <span className="font-medium">{log.previousStatus}</span> to <span className="font-medium">{log.newStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-8 mb-6">
          <h3 className="text-lg font-semibold text-[#0A2540] font-inter mb-4">Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {order.status === 'SUBMITTED' && (
              <button className="w-full px-6 py-3 bg-[#16C784] hover:bg-green-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-sm font-inter text-sm">
                ✅ Approve Delivery
              </button>
            )}
            {['PLACED', 'ESCROW_FUNDED', 'IN_PROGRESS', 'SUBMITTED'].includes(order.status) && (
              <button className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-sm font-inter text-sm">
                ⚠️ Raise Dispute
              </button>
            )}
            <button className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-sm font-inter text-sm">
              📧 Contact Seller
            </button>
            <button className="w-full px-6 py-3 bg-white hover:bg-neutral-50 text-[#0A2540] border border-neutral-200 rounded-xl font-semibold transition-all duration-200 shadow-sm font-inter text-sm">
              📋 Download Invoice
            </button>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">{getStatusIcon(order.status)}</span>
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#0A2540] font-inter">
                Current Status: <span className="text-indigo-600">{order.status.replace(/_/g, ' ')}</span>
              </h3>
              <p className="text-sm text-neutral-500 font-inter mt-1">
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