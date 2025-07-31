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
      'PLACED': 'bg-blue-100 text-blue-800',
      'ESCROW_FUNDED': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-orange-100 text-orange-800',
      'SUBMITTED': 'bg-purple-100 text-purple-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'DISPUTED': 'bg-red-100 text-red-800',
      'RELEASED': 'bg-green-100 text-green-800',
      'REFUNDED': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Order</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/buyer/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h3>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <button 
            onClick={() => navigate('/buyer/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/buyer/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
          <div className="w-32"></div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Order #{order.id}</h2>
              <p className="text-gray-600">Created on {formatDate(order.createdAt)}</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)} {order.status.replace('_', ' ')}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Platform:</span> {order.platform}</div>
                <div><span className="font-medium">Product Link:</span> 
                  <a href={order.productLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                    View
                  </a>
                </div>
                <div><span className="font-medium">Country:</span> {order.country}</div>
                <div><span className="font-medium">Currency:</span> {order.currency}</div>
                <div><span className="font-medium">Seller Contact:</span> {order.sellerContact}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Project Details</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Product Type:</span> {order.scopeBox.productType}</div>
                <div><span className="font-medium">Price:</span> {formatPrice(order.scopeBox.price, order.currency)}</div>
                <div><span className="font-medium">Deadline:</span> {formatDate(order.scopeBox.deadline)}</div>
                <div><span className="font-medium">Condition:</span> {order.scopeBox.condition}</div>
                <div><span className="font-medium">Attachments:</span> {order.scopeBox.attachments?.length || 0} files</div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
              {order.scopeBox.description}
            </p>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Timeline</h3>
          
          <div className="space-y-4">
            {order.orderLogs?.map((log, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-semibold">{index + 1}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {log.event.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(log.timestamp)}
                  </div>
                  {log.previousStatus && log.newStatus && (
                    <div className="text-xs text-gray-400 mt-1">
                      Status changed from {log.previousStatus} to {log.newStatus}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.status === 'SUBMITTED' && (
              <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                ✅ Approve Delivery
              </button>
            )}
            
            {['PLACED', 'ESCROW_FUNDED', 'IN_PROGRESS', 'SUBMITTED'].includes(order.status) && (
              <button className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                ⚠️ Raise Dispute
              </button>
            )}
            
            <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              📧 Contact Seller
            </button>
            
            <button className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium">
              📋 Download Invoice
            </button>
          </div>
        </div>

        {/* Status Description */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">{getStatusIcon(order.status)}</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Current Status: {order.status.replace('_', ' ')}
              </h3>
              <p className="text-gray-600">
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