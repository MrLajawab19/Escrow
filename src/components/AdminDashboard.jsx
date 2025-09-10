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
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/disputes/${disputeId}/resolve`, {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl font-bold text-white">EscrowX Admin Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-white">{orders.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Active Disputes</p>
                <p className="text-2xl font-bold text-white">{disputes.filter(d => d.status === 'open').length}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Resolved Disputes</p>
                <p className="text-2xl font-bold text-white">{disputes.filter(d => d.status === 'resolved').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Disputes Section */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Dispute Management</h2>
          
          {disputes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/60">No disputes found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dispute.status === 'open' ? 'bg-red-500/20 text-red-400' :
                        dispute.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {dispute.status}
                      </span>
                      <span className="text-white font-medium">Order #{dispute.orderId}</span>
                    </div>
                    <div className="text-white/60 text-sm">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-white/80 text-sm mb-1">Dispute Reason:</p>
                    <p className="text-white">{dispute.reason}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-white/80 text-sm mb-1">Description:</p>
                    <p className="text-white/90">{dispute.description}</p>
                  </div>

                  {dispute.evidenceFiles && dispute.evidenceFiles.length > 0 && (
                    <div className="mb-4">
                      <p className="text-white/80 text-sm mb-2">Evidence Files:</p>
                      <div className="flex flex-wrap gap-2">
                        {dispute.evidenceFiles.map((file, index) => (
                          <a
                            key={index}
                            href={`/uploads/${file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                          >
                            📎 {file}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {dispute.status === 'open' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedDispute(dispute)}
                        className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors text-sm"
                      >
                        Resolve Dispute
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Recent Orders</h2>
          
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/60">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/80 pb-3">Order ID</th>
                    <th className="text-left text-white/80 pb-3">Service</th>
                    <th className="text-left text-white/80 pb-3">Amount</th>
                    <th className="text-left text-white/80 pb-3">Status</th>
                    <th className="text-left text-white/80 pb-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((order) => (
                    <tr key={order.id} className="border-b border-white/5">
                      <td className="py-3 text-white">#{order.id}</td>
                      <td className="py-3 text-white/90">{order.serviceType}</td>
                      <td className="py-3 text-white/90">${order.amount}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          order.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                          order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-white/60">
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

      {/* Dispute Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/20 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              Resolve Dispute #{selectedDispute.id}
            </h3>
            
            <div className="mb-4">
              <label className="block text-white/80 text-sm mb-2">Resolution Action</label>
              <select
                value={resolutionAction}
                onChange={(e) => setResolutionAction(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select action...</option>
                <option value="refund_buyer">Refund Buyer</option>
                <option value="release_to_seller">Release to Seller</option>
                <option value="partial_refund">Partial Refund</option>
                <option value="escalate">Escalate Further</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-white/80 text-sm mb-2">Resolution Notes</label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Add notes about the resolution..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleResolveDispute(selectedDispute.id)}
                disabled={!resolutionAction}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Resolve Dispute
              </button>
              <button
                onClick={() => setSelectedDispute(null)}
                className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
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