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
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ESCROW_FUNDED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'ACCEPTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'CHANGES_REQUESTED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SUBMITTED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DISPUTED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'RELEASED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REFUNDED':
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
      case 'CANCELLED':
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PLACED':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'ESCROW_FUNDED':
      case 'RELEASED':
      case 'COMPLETED':
        return (
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'REJECTED':
      case 'CANCELLED':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'CHANGES_REQUESTED':
      case 'IN_PROGRESS':
        return (
          <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'DISPUTED':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusIconBg = (status) => {
    switch (status) {
      case 'PLACED': return 'bg-blue-100';
      case 'ESCROW_FUNDED':
      case 'RELEASED':
      case 'COMPLETED': return 'bg-emerald-100';
      case 'REJECTED':
      case 'CANCELLED': return 'bg-red-100';
      case 'CHANGES_REQUESTED':
      case 'IN_PROGRESS': return 'bg-amber-100';
      case 'DISPUTED': return 'bg-red-100';
      default: return 'bg-neutral-100';
    }
  };

  const canRaiseDispute = () => {
    return order.status === 'SUBMITTED';
  };

  const handleDisputeSubmit = (disputeData) => {
    if (onOrderUpdate) {
      onOrderUpdate({
        ...order,
        status: 'DISPUTED'
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getStatusIconBg(order.status)}`}>
            {getStatusIcon(order.status)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy-900 leading-tight">
              {order.scopeBox?.title || 'Untitled Order'}
            </h3>
            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider font-semibold">
              ID: {order.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${getStatusColor(order.status)}`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Order Details */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-2">Description</p>
            <p className="text-neutral-800 text-sm leading-relaxed bg-neutral-50 p-4 rounded-lg border border-neutral-100">
              {order.scopeBox?.description || 'No description provided.'}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-1">Amount</p>
            <p className="text-2xl font-bold text-navy-900">${order.scopeBox?.price?.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-1">Deadline</p>
            <p className="text-neutral-800 font-medium">
              {order.scopeBox?.deadline ? new Date(order.scopeBox.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'No deadline'}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-1">Created</p>
            <p className="text-neutral-800 font-medium">
              {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Deliverables */}
        {order.scopeBox?.deliverables && order.scopeBox.deliverables.length > 0 && (
          <div className="mb-2">
            <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">Deliverables</p>
            <div className="flex flex-wrap gap-2">
              {order.scopeBox.deliverables.map((deliverable, index) => (
                <span key={index} className="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-md border border-neutral-200">
                  {deliverable}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex flex-wrap items-center gap-3">
        {/* Release Funds Button (for buyers when SUBMITTED) */}
        {userType === 'buyer' && order.status === 'SUBMITTED' && (
          <button
            onClick={async () => {
              try {
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
                    if (onOrderUpdate) {
                      onOrderUpdate({ ...order, status: 'COMPLETED' });
                    }
                    showNotification('Funds released successfully! Payment sent to seller. Order completed.', 'success');
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
            className="btn btn-primary"
          >
            Release Funds
          </button>
        )}

        {/* Cancel Order Button */}
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
                    if (onOrderUpdate) {
                      onOrderUpdate({ ...order, status: 'CANCELLED' });
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
            className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50"
          >
            Cancel Order
          </button>
        )}

        {/* Review Changes Button */}
        {userType === 'buyer' && order.status === 'CHANGES_REQUESTED' && (
          <button
            onClick={() => {
              if (onReviewChanges) onReviewChanges(order);
            }}
            className="btn bg-amber-500 hover:bg-amber-600 text-white"
          >
            Review Changes
          </button>
        )}

        {/* Raise Dispute Button */}
        {canRaiseDispute() && (
          <button
            onClick={() => setShowDisputeModal(true)}
            className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50"
          >
            Raise Dispute
          </button>
        )}

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
                    sellerId: 'seller-id',
                    deliveryFiles: ['final-delivery.zip', 'project-documentation.pdf', 'source-code.zip']
                  })
                });

                if (response.ok) {
                  const result = await response.json();
                  if (result.success) {
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
            className="btn btn-primary"
          >
            Mark as Delivered
          </button>
        )}

        {/* View Details Button */}
        <button
          onClick={() => {
            const width = 800;
            const height = 900;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;
            const printWindow = window.open('', '', `width=${width},height=${height},left=${left},top=${top}`);

            const html = `
              <html>
                <head>
                  <title>Order Details - ${order.scopeBox?.title || 'Untitled Order'}</title>
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; background: #f6f9fc; color: #1a1f36; line-height: 1.6; }
                    .print-area { background: #fff; max-width: 700px; margin: 40px auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08); padding: 48px; position: relative; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid #e6ebf1; }
                    .brand { font-size: 24px; font-weight: 700; color: #0a2540; letter-spacing: -0.5px; }
                    .header-top-right { text-align: right; }
                    .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; background: #e3e8ee; color: #425466; margin-bottom: 8px; }
                    .order-id { font-size: 14px; color: #697386; font-family: monospace; }
                    h1 { margin: 0 0 8px 0; color: #0a2540; font-size: 28px; font-weight: 700; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
                    .label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #697386; margin-bottom: 4px; display: block; }
                    .value { font-size: 16px; color: #0a2540; margin: 0; }
                    .value.price { font-size: 24px; font-weight: 700; }
                    .section { margin-bottom: 32px; }
                    .section-title { font-size: 16px; font-weight: 600; color: #0a2540; margin: 0 0 12px 0; border-bottom: 1px solid #e6ebf1; padding-bottom: 8px; }
                    .desc-box { background: #f6f9fc; border-radius: 6px; padding: 16px; font-size: 15px; color: #425466; }
                    ul { margin: 0; padding-left: 20px; color: #425466; }
                    li { margin-bottom: 8px; }
                    .print-btn { position: absolute; top: -50px; right: 0; background: #635bff; color: #fff; border: none; border-radius: 4px; padding: 8px 16px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08); transition: all 0.15s ease; }
                    .print-btn:hover { transform: translateY(-1px); box-shadow: 0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08); background: #5469d4; }
                    .footer { text-align: center; color: #8898aa; font-size: 12px; margin-top: 48px; pt-24; border-top: 1px solid #e6ebf1; padding-top: 24px; }
                    @media print { 
                      body { background: #fff; }
                      .print-area { box-shadow: none; margin: 0; padding: 0; max-width: 100%; }
                      .print-btn { display: none !important; } 
                    }
                  </style>
                </head>
                <body>
                  <div class="print-area">
                    <button class="print-btn" onclick="window.print()">Print Receipt</button>
                    
                    <div class="header">
                      <div>
                        <div class="brand">ScrowX</div>
                        <div style="color: #697386; font-size: 14px; margin-top: 4px;">Secure Escrow Receipt</div>
                      </div>
                      <div class="header-top-right">
                        <div class="status-badge">${order.status.replace(/_/g, ' ')}</div>
                        <div class="order-id">ID: ${order.id}</div>
                      </div>
                    </div>

                    <h1>${order.scopeBox?.title || 'Untitled Order'}</h1>
                    
                    <div class="grid" style="margin-top: 32px;">
                      <div>
                        <span class="label">Total Amount</span>
                        <p class="value price">$${order.scopeBox?.price?.toLocaleString() || '0'}</p>
                      </div>
                      <div>
                        <span class="label">Date Created</span>
                        <p class="value">${new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div>
                        <span class="label">Expected Delivery</span>
                        <p class="value">${order.scopeBox?.deadline ? new Date(order.scopeBox.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}</p>
                      </div>
                      <div>
                        <span class="label">Last Updated</span>
                        <p class="value">${new Date(order.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>

                    <div class="section">
                      <h3 class="section-title">Order Description</h3>
                      <div class="desc-box">${order.scopeBox?.description || 'No description provided.'}</div>
                    </div>

                    <div class="section">
                      <h3 class="section-title">Deliverables Timeline</h3>
                      <ul>
                        ${(order.scopeBox?.deliverables || []).map(d => `<li>${d}</li>`).join('') || '<li>No specific deliverables listed</li>'}
                      </ul>
                    </div>

                    ${order.deliveryFiles && order.deliveryFiles.length > 0 ? `
                    <div class="section">
                      <h3 class="section-title">Submitted Files</h3>
                      <ul>
                        ${order.deliveryFiles.map(f => `<li>${f}</li>`).join('')}
                      </ul>
                    </div>
                    ` : ''}

                    <div class="footer">
                      Generated by ScrowX Secure Escrow Infrastructure &mdash; ${new Date().toLocaleString()}
                    </div>
                  </div>
                </body>
              </html>
            `;
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
          }}
          className="btn btn-outline ml-auto"
        >
          View Receipt
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

      {/* Notification Popup */}
      {notification.show && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center z-[70] animate-fadeIn">
          <div className="bg-white rounded-xl shadow-elevation p-6 max-w-sm mx-4 transform transition-all border border-neutral-200">
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                  notification.type === 'error' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                }`}>
                {notification.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : notification.type === 'error' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-navy-900">
                  {notification.type === 'success' ? 'Success' :
                    notification.type === 'error' ? 'Error' :
                      'Update'}
                </p>
                <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{notification.message}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setNotification({ show: false, message: '', type: '' })}
                className="btn btn-outline text-sm py-1.5 px-4"
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