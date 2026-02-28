import React, { useState, useEffect } from 'react';
import OrderCard from '../components/OrderCard';
import MyDisputesPage from '../components/MyDisputesPage';
import NotificationModal from '../components/NotificationModal';
import axios from 'axios';

const inputClass = "w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-[#0A2540] placeholder-neutral-400 font-inter text-sm shadow-sm";
const labelClass = "block text-sm font-medium mb-1.5 text-[#0A2540] font-inter";

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
      if (!token) { setError('Authentication required'); return; }
      const response = await axios.get('/api/orders/seller', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load orders');
      }
    } catch (err) {
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
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
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
        setNotification({ isOpen: true, title: 'Success', message: 'Order accepted successfully!', type: 'success' });
      } else {
        setNotification({ isOpen: true, title: 'Error', message: 'Failed to accept order: ' + response.data.message, type: 'error' });
      }
    } catch (error) {
      setNotification({ isOpen: true, title: 'Error', message: 'Error accepting order. Please try again.', type: 'error' });
    }
  };

  const handleRejectOrder = async (order) => {
    try {
      const token = localStorage.getItem('sellerToken');
      if (!token) { setNotification({ isOpen: true, title: 'Auth Required', message: 'Please login.', type: 'error' }); return; }
      const response = await axios.patch(`/api/orders/${order.id}/reject`, {}, {
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
      const response = await axios.patch(`/api/orders/${requestChangesOrder.id}/request-changes`, {
        scopeBox: modifiedScopeBox,
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
          <h3 className="text-lg font-bold text-[#0A2540] mb-2 font-inter">Error Loading Orders</h3>
          <p className="text-neutral-600 mb-6 text-sm font-inter">{error}</p>
          <button onClick={fetchOrders} className="w-full py-3 px-4 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 shadow-md font-inter text-sm">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F9FC]">
      {/* Dashboard Sub-header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            <h1 className="text-xl font-bold text-[#0A2540] tracking-tight font-inter">Seller Dashboard</h1>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-neutral-500 font-medium font-inter hidden sm:inline-block">Welcome, Seller</span>
              <button
                onClick={() => setShowMyDisputes(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-semibold transition-colors font-inter"
              >
                <span>⚠️</span> My Disputes
              </button>
              <button
                onClick={() => setShowRequests(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-md font-inter"
              >
                View Requests
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* My Disputes Modal */}
      {showMyDisputes && (
        <MyDisputesPage userType="seller" onClose={() => setShowMyDisputes(false)} />
      )}

      {/* Requests Modal */}
      {showRequests && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xl max-w-4xl w-full p-8 relative max-h-[85vh] overflow-y-auto mx-4">
            <button className="absolute top-4 right-5 text-neutral-400 hover:text-neutral-700 text-2xl transition-colors" onClick={() => setShowRequests(false)}>×</button>
            <h2 className="text-xl font-bold mb-6 text-[#0A2540] font-inter">Order Requests</h2>
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
                        <div className="font-semibold text-[#0A2540] font-inter mb-1">{order.scopeBox?.title || 'Untitled Order'}</div>
                        <div className="text-sm text-neutral-500 font-inter mb-2">From: {order.buyerName || 'Unknown Buyer'}</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                          <div><span className="text-neutral-400 font-inter">Deadline: </span><span className="font-medium text-[#0A2540] font-inter">{order.scopeBox?.deadline ? new Date(order.scopeBox.deadline).toLocaleDateString() : 'N/A'}</span></div>
                          <div><span className="text-neutral-400 font-inter">Price: </span><span className="font-medium text-[#0A2540] font-inter">${order.scopeBox?.price || 0}</span></div>
                          <div><span className="text-neutral-400 font-inter">Platform: </span><span className="font-medium text-[#0A2540] font-inter">{order.platform || 'N/A'}</span></div>
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
            <h2 className="text-xl font-bold mb-6 text-[#0A2540] font-inter">Scope Box Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <span className="font-medium text-neutral-500 font-inter">Title</span>
                <span className="font-semibold text-[#0A2540] font-inter text-right">{scopeBoxOrder.scopeBox?.title}</span>
              </div>
              <div className="py-2 border-b border-neutral-100">
                <span className="font-medium text-neutral-500 font-inter block mb-1">Description</span>
                <p className="text-[#0A2540] font-inter">{scopeBoxOrder.scopeBox?.description}</p>
              </div>
              <div className="py-2 border-b border-neutral-100">
                <span className="font-medium text-neutral-500 font-inter block mb-1">Deliverables</span>
                <ul className="list-disc ml-4 text-[#0A2540] font-inter space-y-1">
                  {(scopeBoxOrder.scopeBox?.deliverables || []).map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <span className="font-medium text-neutral-500 font-inter">Deadline</span>
                <span className="font-semibold text-[#0A2540] font-inter">{scopeBoxOrder.scopeBox?.deadline ? new Date(scopeBoxOrder.scopeBox.deadline).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <span className="font-medium text-neutral-500 font-inter">Price</span>
                <span className="font-bold text-[#0A2540] font-inter">${scopeBoxOrder.scopeBox?.price || 0}</span>
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
              <button className="px-5 py-2.5 bg-[#16C784] hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm font-inter" onClick={() => handleAcceptOrder(scopeBoxOrder)}>✓ Accept</button>
              <button className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm font-inter" onClick={() => handleRejectOrder(scopeBoxOrder)}>✕ Reject</button>
              <button className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm font-inter" onClick={() => handleRequestChanges(scopeBoxOrder)}>✎ Request Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xl max-w-4xl w-full p-8 relative mx-4">
            <button className="absolute top-4 right-5 text-neutral-400 hover:text-neutral-700 text-2xl transition-colors" onClick={() => setSelectedOrder(null)}>×</button>
            <h2 className="text-xl font-bold mb-6 text-[#0A2540] font-inter">Order Details — {selectedOrder.scopeBox?.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-base font-semibold mb-3 text-[#0A2540] font-inter">Order Information</h3>
                <div className="space-y-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                  <div className="flex justify-between py-1.5 border-b border-neutral-100"><span className="text-neutral-500 font-inter">Order ID</span><span className="font-medium text-[#0A2540] font-inter">{selectedOrder.id}</span></div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100">
                    <span className="text-neutral-500 font-inter">Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-inter ${selectedOrder.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        selectedOrder.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' :
                          selectedOrder.status === 'CHANGES_REQUESTED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-neutral-100 text-neutral-600 border border-neutral-200'
                      }`}>{selectedOrder.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100"><span className="text-neutral-500 font-inter">Price</span><span className="font-bold text-[#0A2540] font-inter">${selectedOrder.scopeBox?.price}</span></div>
                  <div className="flex justify-between py-1.5 border-b border-neutral-100"><span className="text-neutral-500 font-inter">Deadline</span><span className="font-medium text-[#0A2540] font-inter">{selectedOrder.scopeBox?.deadline ? new Date(selectedOrder.scopeBox.deadline).toLocaleDateString() : 'No deadline'}</span></div>
                  <div className="flex justify-between py-1.5"><span className="text-neutral-500 font-inter">Updated</span><span className="font-medium text-[#0A2540] font-inter">{new Date(selectedOrder.updatedAt).toLocaleString()}</span></div>
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold mb-3 text-[#0A2540] font-inter">Scope Details</h3>
                <div className="space-y-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                  <div className="py-1.5 border-b border-neutral-100"><span className="text-neutral-500 font-inter">Description</span><p className="mt-1 text-[#0A2540] font-inter leading-relaxed">{selectedOrder.scopeBox?.description}</p></div>
                  <div className="py-1.5">
                    <span className="text-neutral-500 font-inter">Deliverables</span>
                    <ul className="mt-1 space-y-1">
                      {selectedOrder.scopeBox?.deliverables?.map((item, i) => (
                        <li key={i} className="text-sm text-[#0A2540] font-inter flex items-start gap-1.5"><span className="text-indigo-600 mt-0.5">•</span>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-between items-center pt-4 border-t border-neutral-100">
              <button onClick={() => setSelectedOrder(null)} className="px-5 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-[#0A2540] rounded-xl text-sm font-semibold transition-colors font-inter">
                ← Back to Orders
              </button>
              <div className={`text-sm font-inter font-medium px-3 py-1.5 rounded-full ${selectedOrder.status === 'IN_PROGRESS' ? 'text-indigo-700 bg-indigo-50' :
                  selectedOrder.status === 'REJECTED' ? 'text-red-700 bg-red-50' :
                    selectedOrder.status === 'CHANGES_REQUESTED' ? 'text-amber-700 bg-amber-50' :
                      'text-neutral-600 bg-neutral-100'
                }`}>
                {selectedOrder.status === 'IN_PROGRESS' ? '✅ Order accepted — work can begin!' :
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
            <h2 className="text-xl font-bold mb-6 text-[#0A2540] font-inter">Request Changes to Scope Box</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
                <h3 className="font-semibold text-[#0A2540] mb-4 font-inter text-sm uppercase tracking-wide">Original Scope Box</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium text-neutral-500 font-inter">Title: </span><span className="text-[#0A2540] font-inter">{requestChangesOrder.scopeBox?.title}</span></div>
                  <div><span className="font-medium text-neutral-500 font-inter">Description: </span><span className="text-[#0A2540] font-inter">{requestChangesOrder.scopeBox?.description}</span></div>
                  <div><span className="font-medium text-neutral-500 font-inter">Product Type: </span><span className="text-[#0A2540] font-inter">{requestChangesOrder.scopeBox?.productType}</span></div>
                  <div><span className="font-medium text-neutral-500 font-inter">Price: </span><span className="text-[#0A2540] font-inter font-bold">${requestChangesOrder.scopeBox?.price}</span></div>
                  <div><span className="font-medium text-neutral-500 font-inter">Deadline: </span><span className="text-[#0A2540] font-inter">{requestChangesOrder.scopeBox?.deadline ? new Date(requestChangesOrder.scopeBox.deadline).toLocaleDateString() : 'N/A'}</span></div>
                  <div>
                    <span className="font-medium text-neutral-500 font-inter">Deliverables:</span>
                    <ul className="list-disc ml-4 mt-1 space-y-1">
                      {(requestChangesOrder.scopeBox?.deliverables || []).map((d, i) => <li key={i} className="text-[#0A2540] font-inter">{d}</li>)}
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
                      <label className={labelClass}>Price ($)</label>
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
              <button className="px-5 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-[#0A2540] rounded-xl text-sm font-semibold transition-colors font-inter" onClick={() => setShowRequestChanges(false)}>Cancel</button>
              <button className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm font-inter" onClick={handleSubmitChanges}>Submit Changes Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-inter">Total Orders</p>
                <p className="text-2xl font-bold text-[#0A2540] mt-1 font-inter">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-inter">In Progress</p>
                <p className="text-2xl font-bold text-[#0A2540] mt-1 font-inter">{orders.filter(o => o.status === 'IN_PROGRESS').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-inter">Pending Review</p>
                <p className="text-2xl font-bold text-[#0A2540] mt-1 font-inter">{orders.filter(o => o.status === 'SUBMITTED').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-inter">Earnings</p>
                <p className="text-2xl font-bold text-[#0A2540] mt-1 font-inter">
                  ${orders.reduce((sum, o) => sum + (o.scopeBox?.price || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#0A2540] font-inter">Your Orders</h2>
          </div>
          <div className="p-6 bg-neutral-50/30">
            {orders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-neutral-100 border-dashed">
                <div className="mx-auto w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-5">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#0A2540] mb-2 font-inter">No orders yet</h3>
                <p className="text-neutral-500 mb-8 max-w-sm mx-auto leading-relaxed font-inter">Accept order requests to start working with buyers.</p>
                <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-md font-inter text-sm" onClick={() => setShowRequests(true)}>
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
        <div className="mt-6 bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
            <h2 className="text-base font-bold text-[#0A2540] font-inter">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 text-left transition-all duration-200 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors flex-shrink-0">
                    <span className="text-lg">📤</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0A2540] font-inter text-sm">Submit Delivery</h3>
                    <p className="text-xs text-neutral-500 font-inter mt-0.5">Upload completed work</p>
                  </div>
                </div>
              </button>
              <button className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl hover:border-red-200 hover:bg-red-50/30 text-left transition-all duration-200 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors flex-shrink-0">
                    <span className="text-lg">⚠️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0A2540] font-inter text-sm">Raise Dispute</h3>
                    <p className="text-xs text-neutral-500 font-inter mt-0.5">Report issues with buyer</p>
                  </div>
                </div>
              </button>
              <button className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl hover:border-emerald-200 hover:bg-emerald-50/30 text-left transition-all duration-200 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors flex-shrink-0">
                    <span className="text-lg">📊</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0A2540] font-inter text-sm">View Analytics</h3>
                    <p className="text-xs text-neutral-500 font-inter mt-0.5">Track your performance</p>
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