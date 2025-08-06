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
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse-glow"></div>
      </div>
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent font-inter">Seller Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white/80 font-inter">Welcome, Seller</span>
              <button
                onClick={() => setShowMyDisputes(true)}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl hover:scale-105 transition-all duration-300 flex items-center shadow-lg font-inter font-medium"
              >
                <span className="mr-2">🚨</span>
                My Disputes
              </button>
              <button 
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-lg font-inter font-medium" 
                onClick={() => setShowRequests(true)}
              >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-4xl w-full p-8 relative animate-fadeIn max-h-[80vh] overflow-y-auto">
            <button className="absolute top-4 right-6 text-white/70 hover:text-white text-2xl transition-colors" onClick={() => setShowRequests(false)}>&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-white">Order Requests</h2>
            {orders.filter(order => order.status === 'ESCROW_FUNDED').length === 0 ? (
              <div className="text-white/70 text-center py-12">
                <div className="text-6xl mb-6">📭</div>
                <p className="text-lg mb-2">No pending order requests found.</p>
                <p className="text-sm">New orders from buyers will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.filter(order => order.status === 'ESCROW_FUNDED').map(order => (
                  <div key={order.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-white text-lg mb-2">
                          {order.scopeBox?.title || 'Untitled Order'}
                        </div>
                        <div className="text-white/80 mb-2">
                          From: {order.buyerName || 'Unknown Buyer'}
                        </div>
                        <div className="text-white/60 text-sm mb-1">
                          <span className="font-medium">Deadline:</span> {order.scopeBox?.deadline ? new Date(order.scopeBox.deadline).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-white/60 text-sm mb-1">
                          <span className="font-medium">Price:</span> ${order.scopeBox?.price || 0}
                        </div>
                        <div className="text-white/60 text-sm mb-2">
                          <span className="font-medium">Platform:</span> {order.platform || 'N/A'}
                        </div>
                        {order.scopeBox?.description && (
                          <div className="text-white/70 text-sm">
                            <span className="font-medium">Description:</span> {order.scopeBox.description.substring(0, 100)}...
                          </div>
                        )}
                    </div>
                      <div className="mt-4 md:mt-0 md:ml-6">
                        <button 
                          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-fadeIn">
            <button className="absolute top-4 right-6 text-white/70 hover:text-white text-2xl transition-colors" onClick={() => setScopeBoxOrder(null)}>&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-white">Scope Box Details</h2>
            <div className="space-y-4 text-white/90">
              <div><span className="font-semibold text-white">Title:</span> {scopeBoxOrder.scopeBox?.title}</div>
              <div><span className="font-semibold text-white">Description:</span> {scopeBoxOrder.scopeBox?.description}</div>
              <div><span className="font-semibold text-white">Deliverables:</span>
                <ul className="list-disc ml-6 mt-2">
                  {(scopeBoxOrder.scopeBox?.deliverables || []).map((d, i) => <li key={i} className="text-white/80">{d}</li>)}
                </ul>
              </div>
              <div><span className="font-semibold text-white">Deadline:</span> {scopeBoxOrder.scopeBox?.deadline ? new Date(scopeBoxOrder.scopeBox.deadline).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-semibold text-white">Price:</span> ${scopeBoxOrder.scopeBox?.price || 0}</div>
              {/* Attachments */}
              {scopeBoxOrder.scopeBox?.attachments && scopeBoxOrder.scopeBox.attachments.length > 0 && (
                <div>
                  <span className="font-semibold text-white">Attachments:</span>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {scopeBoxOrder.scopeBox.attachments.map((file, idx) => {
                      const ext = file.split('.').pop().toLowerCase();
                      if (["jpg","jpeg","png","gif","bmp","webp"].includes(ext)) {
                        return <img key={idx} src={file} alt="attachment" className="w-20 h-20 object-cover rounded-lg border border-white/20" />;
                      } else if (["mp4","webm","ogg"].includes(ext)) {
                        return <video key={idx} src={file} controls className="w-28 h-20 rounded-lg border border-white/20" />;
                      } else {
                        return <a key={idx} href={file} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline block">{file.split('/').pop()}</a>;
                      }
                    })}
                  </div>
                </div>
              )}
            </div>
            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8">
              <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg" onClick={() => handleAcceptOrder(scopeBoxOrder)}>Accept</button>
              <button className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg" onClick={() => handleRejectOrder(scopeBoxOrder)}>Reject</button>
              <button className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg" onClick={() => handleRequestChanges(scopeBoxOrder)}>Request changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Order Details */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-4xl w-full p-8 relative animate-fadeIn">
            <button 
              className="absolute top-4 right-6 text-white/70 hover:text-white text-2xl transition-colors" 
              onClick={() => setSelectedOrder(null)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">
              Order Details - {selectedOrder.scopeBox?.title}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Order Information</h3>
                <div className="space-y-2 text-white/90">
                  <div><span className="font-medium text-white">Order ID:</span> {selectedOrder.id}</div>
                  <div><span className="font-medium text-white">Status:</span> 
                    <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                      selectedOrder.status === 'IN_PROGRESS' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      selectedOrder.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      selectedOrder.status === 'CHANGES_REQUESTED' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                      'bg-white/20 text-white/80 border border-white/30'
                    }`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div><span className="font-medium text-white">Price:</span> ${selectedOrder.scopeBox?.price}</div>
                  <div><span className="font-medium text-white">Deadline:</span> {selectedOrder.scopeBox?.deadline ? new Date(selectedOrder.scopeBox.deadline).toLocaleDateString() : 'No deadline'}</div>
                  <div><span className="font-medium text-white">Updated:</span> {new Date(selectedOrder.updatedAt).toLocaleString()}</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Scope Details</h3>
                <div className="space-y-2 text-white/90">
                  <div><span className="font-medium text-white">Description:</span> {selectedOrder.scopeBox?.description}</div>
                  <div><span className="font-medium text-white">Deliverables:</span>
                    <ul className="ml-4 mt-1">
                      {selectedOrder.scopeBox?.deliverables?.map((item, index) => (
                        <li key={index} className="text-sm text-white/80">• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Back to Orders
              </button>
              <div className="text-sm text-white/70">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-4xl w-full p-8 relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <button className="absolute top-4 right-6 text-white/70 hover:text-white text-2xl transition-colors" onClick={() => setShowRequestChanges(false)}>&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-white">Request Changes to Scope Box</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Scope Box */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">Original Scope Box</h3>
                <div className="space-y-3 text-sm text-white/90">
                  <div><span className="font-medium text-white">Title:</span> {requestChangesOrder.scopeBox?.title}</div>
                  <div><span className="font-medium text-white">Description:</span> {requestChangesOrder.scopeBox?.description}</div>
                  <div><span className="font-medium text-white">Product Type:</span> {requestChangesOrder.scopeBox?.productType}</div>
                  <div><span className="font-medium text-white">Price:</span> ${requestChangesOrder.scopeBox?.price}</div>
                  <div><span className="font-medium text-white">Deadline:</span> {requestChangesOrder.scopeBox?.deadline ? new Date(requestChangesOrder.scopeBox.deadline).toLocaleDateString() : 'N/A'}</div>
                  <div><span className="font-medium text-white">Deliverables:</span>
                    <ul className="list-disc ml-4 mt-2">
                      {(requestChangesOrder.scopeBox?.deliverables || []).map((d, i) => <li key={i} className="text-white/80">{d}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Modified Scope Box Form */}
              <div className="bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <h3 className="font-semibold text-cyan-300 mb-4">Proposed Changes</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Title</label>
                    <input
                      type="text"
                      value={modifiedScopeBox?.title || ''}
                      onChange={(e) => handleScopeBoxChange('title', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Description</label>
                    <textarea
                      value={modifiedScopeBox?.description || ''}
                      onChange={(e) => handleScopeBoxChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Product Type</label>
                    <input
                      type="text"
                      value={modifiedScopeBox?.productType || ''}
                      onChange={(e) => handleScopeBoxChange('productType', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Price ($)</label>
                      <input
                        type="number"
                        value={modifiedScopeBox?.price || ''}
                        onChange={(e) => handleScopeBoxChange('price', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Deadline</label>
                      <input
                        type="date"
                        value={modifiedScopeBox?.deadline ? new Date(modifiedScopeBox.deadline).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleScopeBoxChange('deadline', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                    />
                  </div>
                </div>
                
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Deliverables (comma-separated)</label>
                    <input
                      type="text"
                      value={modifiedScopeBox?.deliverables?.join(', ') || ''}
                      onChange={(e) => handleScopeBoxChange('deliverables', e.target.value.split(',').map(d => d.trim()))}
                      className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                      placeholder="Logo in PNG format, Logo in SVG format, Brand guidelines"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Reason for Changes</label>
                    <textarea
                      value={modifiedScopeBox?.changeReason || ''}
                      onChange={(e) => handleScopeBoxChange('changeReason', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                      placeholder="Explain why these changes are needed..."
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8">
              <button 
                className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                onClick={() => setShowRequestChanges(false)}
              >
                Cancel
              </button>
              <button 
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
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
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">⚡</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80 font-inter">In Progress</p>
                <p className="text-2xl font-bold text-white font-inter">
                  {orders.filter(order => order.status === 'IN_PROGRESS').length}
                </p>
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
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80 font-inter">Earnings</p>
                <p className="text-2xl font-bold text-white font-inter">
                  ${orders.reduce((sum, order) => sum + (order.scopeBox?.price || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-lg font-semibold text-white font-inter">Your Orders</h2>
          </div>
          <div className="p-6">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-white/40 text-6xl mb-4 animate-bounce-slow">📋</div>
                <h3 className="text-lg font-semibold text-white mb-2 font-inter">No orders yet</h3>
                <p className="text-white/80 mb-6 font-inter">Start by accepting order requests</p>
                <button 
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-inter font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                  onClick={() => setShowRequests(true)}
                >
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
        <div className="mt-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-lg font-medium text-white font-inter">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 text-left transition-all duration-300 hover:scale-105">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📤</span>
                  <div>
                    <h3 className="font-medium text-white font-inter">Submit Delivery</h3>
                    <p className="text-sm text-white/70 font-inter">Upload completed work</p>
                  </div>
                </div>
              </button>
              
              <button className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 text-left transition-all duration-300 hover:scale-105">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🚨</span>
                  <div>
                    <h3 className="font-medium text-white font-inter">Raise Dispute</h3>
                    <p className="text-sm text-white/70 font-inter">Report issues with buyer</p>
                  </div>
                </div>
              </button>
              
              <button className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 text-left transition-all duration-300 hover:scale-105">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📊</span>
                  <div>
                    <h3 className="font-medium text-white font-inter">View Analytics</h3>
                    <p className="text-sm text-white/70 font-inter">Track your performance</p>
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