import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [disputes, setDisputes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionAction, setResolutionAction] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchDisputes();
    fetchOrders();
  }, []);

  const fetchDisputes = async () => {
    try {
      const response = await axios.get('/api/disputes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setDisputes(response.data.disputes || []);
    } catch (error) {
      console.error('Error fetching disputes:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setOrders(response.data.orders || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId) => {
    try {
      const response = await axios.post(`/api/disputes/${disputeId}/resolve`, {
        action: resolutionAction,
        notes: resolutionNotes
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });

      if (response.data.success) {
        fetchDisputes();
        setSelectedDispute(null);
        setResolutionAction('');
        setResolutionNotes('');
      }
    } catch (error) {
      console.error('Error resolving dispute:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    window.location.href = '/admin/login';
  };

  // Status badge color helper
  const getStatusBadge = (status) => {
    const map = {
      open: 'bg-red-50 text-red-700 border border-red-200',
      resolved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      pending: 'bg-amber-50 text-amber-700 border border-amber-200',
      COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      PLACED: 'bg-amber-50 text-amber-700 border border-amber-200',
      SUBMITTED: 'bg-blue-50 text-blue-700 border border-blue-200',
      DISPUTED: 'bg-red-50 text-red-700 border border-red-200',
    };
    return map[status] || 'bg-neutral-100 text-neutral-600 border border-neutral-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500 font-inter font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F9FC]">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#0A2540] tracking-tight font-inter">Admin Dashboard</h1>
                <p className="text-xs text-neutral-400 font-inter">ScrowX Administration Panel</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-semibold transition-colors font-inter"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Orders */}
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

          {/* Active Disputes */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-inter">Active Disputes</p>
                <p className="text-2xl font-bold text-[#0A2540] mt-1 font-inter">{disputes.filter(d => d.status === 'open').length}</p>
              </div>
            </div>
          </div>

          {/* Resolved Disputes */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-inter">Resolved</p>
                <p className="text-2xl font-bold text-[#0A2540] mt-1 font-inter">{disputes.filter(d => d.status === 'resolved').length}</p>
              </div>
            </div>
          </div>

          {/* Total Disputes */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-inter">Total Disputes</p>
                <p className="text-2xl font-bold text-[#0A2540] mt-1 font-inter">{disputes.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Disputes Section */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
            <h2 className="text-lg font-bold text-[#0A2540] font-inter">Dispute Management</h2>
            <p className="text-sm text-neutral-500 font-inter mt-0.5">Review and resolve open disputes between buyers and sellers.</p>
          </div>

          <div className="p-6">
            {disputes.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-neutral-200 rounded-lg">
                <div className="mx-auto w-14 h-14 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-neutral-500 font-inter font-medium">No disputes found</p>
                <p className="text-sm text-neutral-400 font-inter mt-1">All transactions are running smoothly.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-inter ${getStatusBadge(dispute.status)}`}>
                          {dispute.status}
                        </span>
                        <span className="font-semibold text-[#0A2540] font-inter text-sm">Order #{dispute.orderId?.slice(0, 8)}...</span>
                      </div>
                      <span className="text-xs text-neutral-400 font-inter">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-inter mb-1">Reason</p>
                      <p className="text-sm text-[#0A2540] font-inter">{dispute.reason}</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-inter mb-1">Description</p>
                      <p className="text-sm text-neutral-600 font-inter leading-relaxed">{dispute.description}</p>
                    </div>

                    {dispute.evidenceFiles && dispute.evidenceFiles.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-inter mb-2">Evidence Files</p>
                        <div className="flex flex-wrap gap-2">
                          {dispute.evidenceFiles.map((file, index) => (
                            <a
                              key={index}
                              href={`/uploads/${file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-xs hover:bg-indigo-100 transition-colors font-inter"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              {file}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {dispute.status === 'open' && (
                      <button
                        onClick={() => setSelectedDispute(dispute)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm font-inter"
                      >
                        Resolve Dispute
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
            <h2 className="text-lg font-bold text-[#0A2540] font-inter">Recent Orders</h2>
            <p className="text-sm text-neutral-500 font-inter mt-0.5">Overview of the latest transactions on the platform.</p>
          </div>

          <div className="p-6">
            {orders.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-neutral-200 rounded-lg">
                <p className="text-neutral-500 font-inter">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider pb-3 font-inter">Order ID</th>
                      <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider pb-3 font-inter">Service</th>
                      <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider pb-3 font-inter">Amount</th>
                      <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider pb-3 font-inter">Status</th>
                      <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider pb-3 font-inter">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {orders.slice(0, 10).map((order) => (
                      <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-3 text-[#0A2540] font-inter font-medium">#{order.id?.slice(0, 8)}...</td>
                        <td className="py-3 text-neutral-600 font-inter">{order.serviceType || order.scopeBox?.productType || '—'}</td>
                        <td className="py-3 text-[#0A2540] font-inter font-semibold">${order.amount || order.scopeBox?.price || 0}</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-inter ${getStatusBadge(order.status)}`}>
                            {order.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-neutral-400 font-inter text-xs">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dispute Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#0A2540] font-inter">
                Resolve Dispute
              </h3>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-neutral-500 font-inter mb-5">
              Order #{selectedDispute.orderId?.slice(0, 8)}... — <span className="text-red-600 font-medium">{selectedDispute.reason}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#0A2540] mb-1.5 font-inter">Resolution Action</label>
              <select
                value={resolutionAction}
                onChange={(e) => setResolutionAction(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-[#0A2540] font-inter text-sm"
              >
                <option value="">Select action...</option>
                <option value="refund_buyer">Refund Buyer</option>
                <option value="release_to_seller">Release to Seller</option>
                <option value="partial_refund">Partial Refund</option>
                <option value="escalate">Escalate Further</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#0A2540] mb-1.5 font-inter">Resolution Notes</label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-[#0A2540] placeholder-neutral-400 font-inter text-sm"
                placeholder="Add notes about the resolution..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleResolveDispute(selectedDispute.id)}
                disabled={!resolutionAction}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-sm font-inter text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Resolution
              </button>
              <button
                onClick={() => setSelectedDispute(null)}
                className="px-4 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-[#0A2540] rounded-xl font-semibold transition-colors font-inter text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;