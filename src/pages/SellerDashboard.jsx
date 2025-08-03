import React, { useState, useEffect } from 'react';
import OrderCard from '../components/OrderCard';
import MyDisputesPage from '../components/MyDisputesPage';
import NotificationModal from '../components/NotificationModal';
import axios from 'axios';

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
  const [notification, setNotification] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('sellerToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.get('/api/orders/seller', {
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
      prevOrders.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
  };

  const handleAcceptOrder = async (order) => {
    try {
      const token = localStorage.getItem('sellerToken');
      if (!token) {
        setNotification({
          isOpen: true,
          title: 'Authentication Required',
          message: 'Please login to perform this action.',
          type: 'error'
        });
        return;
      }

      const response = await axios.patch(`/api/orders/${order.id}/accept`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Update the order status locally
    const updatedOrder = {
      ...order,
          status: 'ACCEPTED'
    };
    
    setOrders(prevOrders => 
      prevOrders.map(o => 
        o.id === order.id ? updatedOrder : o
      )
    );
    
        // Close modals
    setScopeBoxOrder(null);
    setShowRequests(false);
    setSelectedOrder(updatedOrder);
    
        setNotification({
          isOpen: true,
          title: 'Success',
          message: 'Order accepted successfully!',
          type: 'success'
        });
      } else {
        setNotification({
          isOpen: true,
          title: 'Error',
          message: 'Failed to accept order: ' + response.data.message,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      setNotification({
        isOpen: true,
        title: 'Error',
        message: 'Error accepting order. Please try again.',
        type: 'error'
      });
    }
  };

  const handleRejectOrder = async (order) => {
    try {
      const token = localStorage.getItem('sellerToken');
      if (!token) {
        setNotification({
          isOpen: true,
          title: 'Authentication Required',
          message: 'Please login to perform this action.',
          type: 'error'
        });
        return;
      }

      const response = await axios.patch(`/api/orders/${order.id}/reject`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Update the order status locally
    const updatedOrder = {
      ...order,
          status: 'REJECTED'
    };
    
    setOrders(prevOrders => 
      prevOrders.map(o => 
        o.id === order.id ? updatedOrder : o
      )
    );
    
        // Close modals
    setScopeBoxOrder(null);
    setShowRequests(false);
    setSelectedOrder(updatedOrder);
    
        setNotification({
          isOpen: true,
          title: 'Success',
          message: 'Order rejected successfully!',
          type: 'success'
        });
      } else {
        setNotification({
          isOpen: true,
          title: 'Error',
          message: 'Failed to reject order: ' + response.data.message,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      setNotification({
        isOpen: true,
        title: 'Error',
        message: 'Error rejecting order. Please try again.',
        type: 'error'
      });
    }
  };

  const handleRequestChanges = async (order) => {
    // Set the order for request changes and initialize modified scope box
    setRequestChangesOrder(order);
    setModifiedScopeBox({
      ...order.scopeBox,
      changesRequested: true,
      requestedBy: 'seller',
      requestedAt: new Date().toISOString()
    });
    setShowRequestChanges(true);
  };

  const handleScopeBoxChange = (field, value) => {
    setModifiedScopeBox(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitChanges = async () => {
    try {
      const token = localStorage.getItem('sellerToken');
      if (!token) {
        setNotification({
          isOpen: true,
          title: 'Authentication Required',
          message: 'Please login to perform this action.',
          type: 'error'
        });
        return;
      }

      const response = await axios.patch(`/api/orders/${requestChangesOrder.id}/request-changes`, {
        scopeBox: modifiedScopeBox,
        changesRequested: true
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Update the order status locally
    const updatedOrder = {
      ...requestChangesOrder,
      scopeBox: modifiedScopeBox,
      status: 'CHANGES_REQUESTED',
      updatedAt: new Date().toISOString()
    };
    
    setOrders(prevOrders => 
      prevOrders.map(o => 
        o.id === requestChangesOrder.id ? updatedOrder : o
      )
    );
    
    // Close modals and show success
    setShowRequestChanges(false);
    setRequestChangesOrder(null);
    setModifiedScopeBox(null);
    setScopeBoxOrder(null);
    setShowRequests(false);
    
    // Set selected order to show the updated status
    setSelectedOrder(updatedOrder);
        
        setNotification({
          isOpen: true,
          title: 'Success',
          message: 'Changes requested successfully!',
          type: 'success'
        });
      } else {
        setNotification({
          isOpen: true,
          title: 'Error',
          message: 'Failed to request changes: ' + response.data.message,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error requesting changes:', error);
      setNotification({
        isOpen: true,
        title: 'Error',
        message: 'Error requesting changes. Please try again.',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, Seller</span>
              <button
                onClick={() => setShowMyDisputes(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <span className="mr-1">🚨</span>
                My Disputes
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" onClick={() => setShowRequests(true)}>
                View Requests
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* My Disputes Modal */}
      {showMyDisputes && (
        <MyDisputesPage
          userType="seller"
          onClose={() => setShowMyDisputes(false)}
        />
      )}

      {/* Requests Modal */}
      {showRequests && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 relative animate-fadeIn max-h-[80vh] overflow-y-auto">
            <button className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowRequests(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-blue-700">Order Requests</h2>
            {orders.filter(order => order.status === 'ESCROW_FUNDED').length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <div className="text-4xl mb-4">📭</div>
                <p>No pending order requests found.</p>
                <p className="text-sm mt-2">New orders from buyers will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.filter(order => order.status === 'ESCROW_FUNDED').map(order => (
                  <div key={order.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-lg">
                          {order.scopeBox?.title || 'Untitled Order'}
                        </div>
                        <div className="text-gray-600 mt-1">
                          From: {order.buyerName || 'Unknown Buyer'}
                        </div>
                        <div className="text-gray-500 text-sm mt-2">
                          <span className="font-medium">Deadline:</span> {order.scopeBox?.deadline ? new Date(order.scopeBox.deadline).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-gray-500 text-sm">
                          <span className="font-medium">Price:</span> ${order.scopeBox?.price || 0}
                        </div>
                        <div className="text-gray-500 text-sm">
                          <span className="font-medium">Platform:</span> {order.platform || 'N/A'}
                        </div>
                        {order.scopeBox?.description && (
                          <div className="text-gray-600 text-sm mt-2">
                            <span className="font-medium">Description:</span> {order.scopeBox.description.substring(0, 100)}...
                          </div>
                        )}
                    </div>
                      <div className="mt-3 md:mt-0 md:ml-4">
                        <button 
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          onClick={() => setScopeBoxOrder(order)}
                        >
                          View Details
                      </button>
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative animate-fadeIn">
            <button className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setScopeBoxOrder(null)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-green-700">Scope Box Details</h2>
            <div className="space-y-3">
              <div><span className="font-semibold">Title:</span> {scopeBoxOrder.scopeBox?.title}</div>
              <div><span className="font-semibold">Description:</span> {scopeBoxOrder.scopeBox?.description}</div>
              <div><span className="font-semibold">Deliverables:</span>
                <ul className="list-disc ml-6">
                  {(scopeBoxOrder.scopeBox?.deliverables || []).map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
              <div><span className="font-semibold">Deadline:</span> {scopeBoxOrder.scopeBox?.deadline ? new Date(scopeBoxOrder.scopeBox.deadline).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-semibold">Price:</span> ${scopeBoxOrder.scopeBox?.price || 0}</div>
              {/* Attachments */}
              {scopeBoxOrder.scopeBox?.attachments && scopeBoxOrder.scopeBox.attachments.length > 0 && (
                <div>
                  <span className="font-semibold">Attachments:</span>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {scopeBoxOrder.scopeBox.attachments.map((file, idx) => {
                      const ext = file.split('.').pop().toLowerCase();
                      if (["jpg","jpeg","png","gif","bmp","webp"].includes(ext)) {
                        return <img key={idx} src={file} alt="attachment" className="w-20 h-20 object-cover rounded border" />;
                      } else if (["mp4","webm","ogg"].includes(ext)) {
                        return <video key={idx} src={file} controls className="w-28 h-20 rounded border" />;
                      } else {
                        return <a key={idx} href={file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block">{file.split('/').pop()}</a>;
                      }
                    })}
                  </div>
                </div>
              )}
            </div>
            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-8">
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700" onClick={() => handleAcceptOrder(scopeBoxOrder)}>Accept</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" onClick={() => handleRejectOrder(scopeBoxOrder)}>Reject</button>
              <button className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600" onClick={() => handleRequestChanges(scopeBoxOrder)}>Request changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Order Details */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 relative animate-fadeIn">
            <button 
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl" 
              onClick={() => setSelectedOrder(null)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-green-700">
              Order Details - {selectedOrder.scopeBox?.title}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Order Information</h3>
                <div className="space-y-2">
                  <div><span className="font-medium">Order ID:</span> {selectedOrder.id}</div>
                  <div><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${
                      selectedOrder.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      selectedOrder.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      selectedOrder.status === 'CHANGES_REQUESTED' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div><span className="font-medium">Price:</span> ${selectedOrder.scopeBox?.price}</div>
                  <div><span className="font-medium">Deadline:</span> {selectedOrder.scopeBox?.deadline ? new Date(selectedOrder.scopeBox.deadline).toLocaleDateString() : 'No deadline'}</div>
                  <div><span className="font-medium">Updated:</span> {new Date(selectedOrder.updatedAt).toLocaleString()}</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Scope Details</h3>
                <div className="space-y-2">
                  <div><span className="font-medium">Description:</span> {selectedOrder.scopeBox?.description}</div>
                  <div><span className="font-medium">Deliverables:</span>
                    <ul className="ml-4 mt-1">
                      {selectedOrder.scopeBox?.deliverables?.map((item, index) => (
                        <li key={index} className="text-sm">• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Back to Orders
              </button>
              <div className="text-sm text-gray-600">
                {selectedOrder.status === 'IN_PROGRESS' ? '✅ Order accepted and work can begin!' : 
                 selectedOrder.status === 'REJECTED' ? '❌ Order rejected' :
                 selectedOrder.status === 'CHANGES_REQUESTED' ? '📝 Changes requested - waiting for buyer approval' :
                 'Order updated'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {showRequestChanges && requestChangesOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <button className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowRequestChanges(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-yellow-700">Request Changes to Scope Box</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Scope Box */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-800 mb-3">Original Scope Box</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Title:</span> {requestChangesOrder.scopeBox?.title}</div>
                  <div><span className="font-medium">Description:</span> {requestChangesOrder.scopeBox?.description}</div>
                  <div><span className="font-medium">Product Type:</span> {requestChangesOrder.scopeBox?.productType}</div>
                  <div><span className="font-medium">Price:</span> ${requestChangesOrder.scopeBox?.price}</div>
                  <div><span className="font-medium">Deadline:</span> {requestChangesOrder.scopeBox?.deadline ? new Date(requestChangesOrder.scopeBox.deadline).toLocaleDateString() : 'N/A'}</div>
                  <div><span className="font-medium">Deliverables:</span>
                    <ul className="list-disc ml-4 mt-1">
                      {(requestChangesOrder.scopeBox?.deliverables || []).map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Modified Scope Box Form */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-blue-800 mb-3">Proposed Changes</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={modifiedScopeBox?.title || ''}
                      onChange={(e) => handleScopeBoxChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={modifiedScopeBox?.description || ''}
                      onChange={(e) => handleScopeBoxChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                    <input
                      type="text"
                      value={modifiedScopeBox?.productType || ''}
                      onChange={(e) => handleScopeBoxChange('productType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                      <input
                        type="number"
                        value={modifiedScopeBox?.price || ''}
                        onChange={(e) => handleScopeBoxChange('price', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                      <input
                        type="date"
                        value={modifiedScopeBox?.deadline ? new Date(modifiedScopeBox.deadline).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleScopeBoxChange('deadline', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deliverables (comma-separated)</label>
                    <input
                      type="text"
                      value={modifiedScopeBox?.deliverables?.join(', ') || ''}
                      onChange={(e) => handleScopeBoxChange('deliverables', e.target.value.split(',').map(d => d.trim()))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Logo in PNG format, Logo in SVG format, Brand guidelines"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Changes</label>
                    <textarea
                      value={modifiedScopeBox?.changeReason || ''}
                      onChange={(e) => handleScopeBoxChange('changeReason', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Explain why these changes are needed..."
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button 
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                onClick={() => setShowRequestChanges(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                onClick={handleSubmitChanges}
              >
                Submit Changes Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-lg">⚡</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {orders.filter(order => order.status === 'IN_PROGRESS').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-lg">📤</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {orders.filter(order => order.status === 'SUBMITTED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-lg">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Earnings</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${orders.reduce((sum, order) => sum + (order.scopeBox?.price || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your Orders</h2>
          </div>
          <div className="p-6">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-500 mb-6">Start by accepting order requests</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  View Requests
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    userType="seller"
                    onOrderUpdate={handleOrderUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📤</span>
                  <div>
                    <h3 className="font-medium text-gray-900">Submit Delivery</h3>
                    <p className="text-sm text-gray-500">Upload completed work</p>
                  </div>
                </div>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🚨</span>
                  <div>
                    <h3 className="font-medium text-gray-900">Raise Dispute</h3>
                    <p className="text-sm text-gray-500">Report issues with buyer</p>
                  </div>
                </div>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📊</span>
                  <div>
                    <h3 className="font-medium text-gray-900">View Analytics</h3>
                    <p className="text-sm text-gray-500">Track your performance</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
};

export default SellerDashboard; 