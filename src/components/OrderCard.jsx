import React, { useState } from 'react';
import DisputeModal from './DisputeModal';

const OrderCard = ({ order, userType, onOrderUpdate, onReviewChanges }) => {
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLACED':
        return 'bg-blue-100 text-blue-800';
      case 'ESCROW_FUNDED':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CHANGES_REQUESTED':
        return 'bg-orange-100 text-orange-800';
      case 'IN_PROGRESS':
        return 'bg-orange-100 text-orange-800';
      case 'SUBMITTED':
        return 'bg-purple-100 text-purple-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'DISPUTED':
        return 'bg-red-100 text-red-800';
      case 'RELEASED':
        return 'bg-green-100 text-green-800';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PLACED':
        return '📋';
      case 'ESCROW_FUNDED':
        return '💰';
      case 'ACCEPTED':
        return '✅';
      case 'REJECTED':
        return '❌';
      case 'CHANGES_REQUESTED':
        return '🔄';
      case 'IN_PROGRESS':
        return '⚡';
      case 'SUBMITTED':
        return '📤';
      case 'APPROVED':
        return '✅';
      case 'COMPLETED':
        return '🎉';
      case 'DISPUTED':
        return '🚨';
      case 'RELEASED':
        return '🎉';
      case 'REFUNDED':
        return '↩️';
      case 'CANCELLED':
        return '❌';
      default:
        return '📄';
    }
  };

  const canRaiseDispute = () => {
    // Buyers can raise dispute when order is SUBMITTED
    // Sellers can also raise dispute if needed
    return order.status === 'SUBMITTED';
  };

  const handleDisputeSubmit = (disputeData) => {
    // Update the order status to DISPUTED
    if (onOrderUpdate) {
      onOrderUpdate({
        ...order,
        status: 'DISPUTED'
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getStatusIcon(order.status)}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {order.scopeBox?.title || 'Untitled Order'}
            </h3>
            <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Description</p>
          <p className="text-gray-900">{order.scopeBox?.description || 'No description'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Price</p>
          <p className="text-gray-900">${order.scopeBox?.price || 0}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Deadline</p>
          <p className="text-gray-900">
            {order.scopeBox?.deadline ? new Date(order.scopeBox.deadline).toLocaleDateString() : 'No deadline'}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Created</p>
          <p className="text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Deliverables */}
      {order.scopeBox?.deliverables && order.scopeBox.deliverables.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-500 mb-2">Deliverables</p>
          <div className="flex flex-wrap gap-2">
            {order.scopeBox.deliverables.map((deliverable, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {deliverable}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
        {/* Release Funds Button (for buyers when SUBMITTED) */}
        {userType === 'buyer' && order.status === 'SUBMITTED' && (
          <button
            onClick={async () => {
              try {
                // Show loading state
                showNotification('Processing fund release...', 'info');
                
                const token = localStorage.getItem('buyerToken');
                const response = await fetch(`/api/orders/${order.id}/release`, {
                  method: 'PATCH',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (response.ok) {
                  const result = await response.json();
                  if (result.success) {
                    // Update the order status locally
                    if (onOrderUpdate) {
                      onOrderUpdate({
                        ...order,
                        status: 'COMPLETED'
                      });
                    }
                    showNotification('✅ Funds released successfully! Payment sent to seller. Order completed.', 'success');
                  } else {
                    showNotification(result.message || 'Failed to release funds', 'error');
                  }
                } else {
                  const errorData = await response.json();
                  showNotification(errorData.message || 'Failed to release funds', 'error');
                }
              } catch (error) {
                console.error('Error releasing funds:', error);
                showNotification('Error releasing funds. Please try again.', 'error');
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
          >
            <span className="mr-1">💰</span>
            Release Funds
          </button>
        )}

        {/* Cancel Order Button (for buyers when order is not accepted by seller) */}
        {userType === 'buyer' && (order.status === 'PLACED' || order.status === 'ESCROW_FUNDED') && (
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('buyerToken');
                const response = await fetch(`/api/orders/${order.id}/cancel`, {
                  method: 'PATCH',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (response.ok) {
                  const result = await response.json();
                  if (result.success) {
                    // Update the order status locally
                    if (onOrderUpdate) {
                      onOrderUpdate({
                        ...order,
                        status: 'CANCELLED'
                      });
                    }
                    showNotification('Order cancelled successfully!', 'success');
                  } else {
                    showNotification(result.message || 'Failed to cancel order', 'error');
                  }
                } else {
                  showNotification('Failed to cancel order', 'error');
                }
              } catch (error) {
                console.error('Error cancelling order:', error);
                showNotification('Error cancelling order', 'error');
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
          >
            <span className="mr-1">❌</span>
            Cancel Order
          </button>
        )}

        {/* Review Changes Button (for buyers when CHANGES_REQUESTED) */}
        {userType === 'buyer' && order.status === 'CHANGES_REQUESTED' && (
          <button
            onClick={() => {
              // This will trigger the changes review modal in the parent component
              if (onReviewChanges) {
                onReviewChanges(order);
              }
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center"
          >
            <span className="mr-1">🔄</span>
            Review Changes
          </button>
        )}

        {/* Raise Dispute Button */}
        {canRaiseDispute() && (
          <button
            onClick={() => setShowDisputeModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
          >
            <span className="mr-1">🚨</span>
            Raise Dispute
          </button>
        )}

        {/* View Dispute Button (when DISPUTED) */}
        {/* Removed - disputes are now managed through the centralized My Disputes page */}

        {/* Order Delivered Button (for sellers when IN_PROGRESS) */}
        {userType === 'seller' && order.status === 'IN_PROGRESS' && (
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('sellerToken');
                const response = await fetch(`/api/orders/${order.id}/submit`, {
                  method: 'PATCH',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    sellerId: 'seller-id', // This should come from auth
                    deliveryFiles: ['final-delivery.zip', 'project-documentation.pdf', 'source-code.zip']
                  })
                });
                
                if (response.ok) {
                  const result = await response.json();
                  if (result.success) {
                    // Update the order status locally
                    if (onOrderUpdate) {
                      onOrderUpdate({
                        ...order,
                        status: 'SUBMITTED',
                        deliveryFiles: ['final-delivery.zip', 'project-documentation.pdf', 'source-code.zip']
                      });
                    }
                    showNotification('Order delivered successfully! Buyer will be notified for approval.', 'success');
                  } else {
                    showNotification(result.message || 'Failed to deliver order', 'error');
                  }
                } else {
                  showNotification('Failed to deliver order', 'error');
                }
              } catch (error) {
                console.error('Error delivering order:', error);
                showNotification('Error delivering order', 'error');
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
          >
            <span className="mr-1">📦</span>
            Order Delivered
          </button>
        )}

        {/* View Details Button */}
        <button
          onClick={() => {
            // Calculate center position for the print window
            const width = 700;
            const height = 900;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;
            // Open the print window centered
            const printWindow = window.open('', '', `width=${width},height=${height},left=${left},top=${top}`);
            const html = `
              <html>
                <head>
                  <title>Order Details - ${order.scopeBox?.title || 'Untitled Order'}</title>
                  <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; background: #f8fafc; }
                    .print-area { background: #fff; max-width: 600px; margin: 40px auto; border-radius: 12px; box-shadow: 0 4px 24px #0001; padding: 32px 40px; position: relative; }
                    .header { background: #2563eb; color: #fff; padding: 18px 0 12px 0; border-radius: 12px 12px 0 0; text-align: center; font-size: 2rem; font-weight: bold; letter-spacing: 2px; margin: -32px -40px 32px -40px; }
                    h2 { margin-bottom: 18px; color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
                    .label { font-weight: 600; color: #374151; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 12px; }
                    .value { color: #111827; }
                    .section { margin-bottom: 22px; }
                    .badge { display: inline-block; padding: 4px 16px; border-radius: 8px; background: #e0e7ff; color: #3730a3; font-size: 15px; font-weight: 600; margin-bottom: 8px; border: 1px solid #a5b4fc; }
                    ul { margin: 0; padding-left: 22px; }
                    li { margin-bottom: 4px; }
                    .divider { border-bottom: 1.5px dashed #e5e7eb; margin: 18px 0; }
                    .footer { text-align: center; color: #6b7280; font-size: 13px; margin-top: 32px; }
                    .print-btn { position: absolute; top: 24px; right: 32px; background: #2563eb; color: #fff; border: none; border-radius: 6px; padding: 8px 18px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px #0002; transition: background 0.2s; }
                    .print-btn:hover { background: #1d4ed8; }
                    @media print { .print-btn { display: none !important; } }
                  </style>
                </head>
                <body>
                  <div class="print-area">
                    <button class="print-btn" onclick="window.print()">🖨️ Print</button>
                    <div class="header">ScrowX</div>
                    <h2>Order Details</h2>
                    <div class="row"><span class="label">Order ID:</span> <span class="value">${order.id}</span></div>
                    <div class="row"><span class="label">Status:</span> <span class="badge">${order.status}</span></div>
                    <div class="row"><span class="label">Title:</span> <span class="value">${order.scopeBox?.title || 'Untitled Order'}</span></div>
                    <div class="row"><span class="label">Price:</span> <span class="value">$${order.scopeBox?.price || 0}</span></div>
                    <div class="row"><span class="label">Deadline:</span> <span class="value">${order.scopeBox?.deadline ? new Date(order.scopeBox.deadline).toLocaleDateString() : 'No deadline'}</span></div>
                    <div class="row"><span class="label">Created:</span> <span class="value">${new Date(order.createdAt).toLocaleDateString()}</span></div>
                    <div class="row"><span class="label">Updated:</span> <span class="value">${new Date(order.updatedAt).toLocaleDateString()}</span></div>
                    <div class="divider"></div>
                    <div class="section"><span class="label">Description:</span><br><span class="value">${order.scopeBox?.description || 'No description'}</span></div>
                    <div class="section"><span class="label">Deliverables:</span>
                      <ul>
                        ${(order.scopeBox?.deliverables || []).map(d => `<li>${d}</li>`).join('') || '<li>None</li>'}
                      </ul>
                    </div>
                    <div class="section"><span class="label">Delivery Files:</span>
                      <ul>
                        ${(order.deliveryFiles || []).map(f => `<li>${f}</li>`).join('') || '<li>None</li>'}
                      </ul>
                    </div>
                    <div class="section"><span class="label">Order Logs:</span>
                      <ul>
                        ${(order.orderLogs || []).map(l => `<li>${typeof l === 'string' ? l : JSON.stringify(l)}</li>`).join('') || '<li>None</li>'}
                      </ul>
                    </div>
                    <div class="footer">Generated by ScrowX &mdash; ${new Date().toLocaleString()}</div>
                  </div>
                </body>
              </html>
            `;
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          📄 View Details
        </button>
      </div>

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        orderId={order.id}
        onSubmit={handleDisputeSubmit}
        userType={userType}
      />

      {/* Dispute Tracker - Removed since disputes are now managed centrally */}

      {/* Notification Popup */}
      {notification.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 transform transition-all ${
            notification.type === 'success' ? 'border-l-4 border-green-500' : 
            notification.type === 'error' ? 'border-l-4 border-red-500' : 
            'border-l-4 border-blue-500'
          }`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                notification.type === 'success' ? 'bg-green-100' : 
                notification.type === 'error' ? 'bg-red-100' : 
                'bg-blue-100'
              }`}>
                {notification.type === 'success' ? (
                  <span className="text-green-600 text-xl">✅</span>
                ) : notification.type === 'error' ? (
                  <span className="text-red-600 text-xl">❌</span>
                ) : (
                  <span className="text-blue-600 text-xl">ℹ️</span>
                )}
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' : 
                  notification.type === 'error' ? 'text-red-800' : 
                  'text-blue-800'
                }`}>
                  {notification.type === 'success' ? 'Success' : 
                   notification.type === 'error' ? 'Error' : 
                   'Information'}
                </p>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setNotification({ show: false, message: '', type: '' })}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCard; 