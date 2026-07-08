import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ─── helpers ────────────────────────────────────────────────────────────────
const adminHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`
});

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

const STATUS_META = {
  PLACED:            { color: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400' },
  ESCROW_FUNDED:     { color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500' },
  ACCEPTED:          { color: 'bg-cyan-100 text-cyan-700',       dot: 'bg-cyan-500' },
  IN_PROGRESS:       { color: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-500' },
  SUBMITTED:         { color: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-500' },
  APPROVED:          { color: 'bg-teal-100 text-teal-700',      dot: 'bg-teal-500' },
  COMPLETED:         { color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500' },
  RELEASED:          { color: 'bg-green-100 text-green-700',    dot: 'bg-green-500' },
  DISPUTED:          { color: 'bg-red-100 text-red-700',        dot: 'bg-red-500' },
  REFUNDED:          { color: 'bg-orange-100 text-orange-700',  dot: 'bg-orange-500' },
  CANCELLED:         { color: 'bg-gray-100 text-gray-500',      dot: 'bg-gray-400' },
  CHANGES_REQUESTED: { color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500' },
  REJECTED:          { color: 'bg-rose-100 text-rose-700',      dot: 'bg-rose-500' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function RiskBadge({ score, flag }) {
  if (flag !== 'AUTO_FLAGGED') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
      Manual
    </span>
  );
  const color = score >= 75 ? 'bg-red-100 text-red-700 border border-red-200'
    : score >= 50 ? 'bg-amber-100 text-amber-700 border border-amber-200'
    : 'bg-orange-100 text-orange-700 border border-orange-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      ⚑ AUTO-FLAGGED
    </span>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent, sub, highlight }) {
  return (
    <div className={`relative overflow-hidden bg-white rounded-2xl border ${highlight ? 'border-red-200 shadow-red-100' : 'border-slate-200'} shadow-sm hover:shadow-md transition-all duration-200 p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className={`text-3xl font-black ${highlight ? 'text-red-600' : 'text-slate-800'} font-inter`}>{value ?? '—'}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl ${accent} flex items-center justify-center text-xl flex-shrink-0`}>
          {icon}
        </div>
      </div>
      {highlight && (
        <div className="absolute top-0 right-0 w-1 h-full bg-red-400 rounded-r-2xl" />
      )}
    </div>
  );
}

// ─── Mini bar chart ──────────────────────────────────────────────────────────
function StatusBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 group">
      <div className="w-28 text-xs text-slate-500 font-medium truncate">{label.replace(/_/g, ' ')}</div>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-8 text-right text-xs font-bold text-slate-700">{count}</div>
      <div className="w-10 text-right text-xs text-slate-400">{pct}%</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deeds, setDeeds] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [kycQueue, setKycQueue] = useState([]);
  const [users, setUsers] = useState({ buyers: [], sellers: [] });
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview'); // 'overview' | 'disputes' | 'orders' | 'settlements'
  const [statusFilter, setStatusFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState('');
  const [search, setSearch] = useState('');
  const [resolving, setResolving] = useState(null); // dispute id
  const [resolveAction, setResolveAction] = useState(''); // REFUND | RELEASE
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, disputesRes, ordersRes, withdrawalsRes, kycRes, usersRes, finRes, deedsRes] = await Promise.all([
        axios.get(`/api/admin/stats`, { headers: adminHeaders() }),
        axios.get(`/api/admin/disputes`, { headers: adminHeaders() }),
        axios.get(`/api/admin/orders`, { headers: adminHeaders() }),
        axios.get(`/api/wallet/admin/withdrawals`, { headers: adminHeaders() }),
        axios.get(`/api/admin/kyc`, { headers: adminHeaders() }),
        axios.get(`/api/admin/users`, { headers: adminHeaders() }),
        axios.get(`/api/admin/financials`, { headers: adminHeaders() }),
        axios.get(`/api/admin/deeds`, { headers: adminHeaders() }),
      ]);
      setStats(statsRes.data.data);
      setDisputes(disputesRes.data.data || []);
      setOrders(ordersRes.data.data || []);
      setDeeds(deedsRes.data.data || []);
      setWithdrawals(withdrawalsRes.data.data || []);
      setKycQueue(kycRes.data.data || []);
      setUsers(usersRes.data.data || { buyers: [], sellers: [] });
      setFinancials(finRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleResolve = async () => {
    if (!resolveAction || !resolving) return;
    setResolveLoading(true);
    try {
      await axios.post(`${API}/api/admin/disputes/${resolving}/resolve`,
        { action: resolveAction, notes: resolveNotes },
        { headers: adminHeaders() }
      );
      showToast(`Dispute ${resolveAction === 'REFUND' ? 'refunded to buyer' : 'released to seller'} ✓`);
      setResolving(null);
      setResolveAction('');
      setResolveNotes('');
      fetchAll();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to resolve', 'error');
    } finally {
      setResolveLoading(false);
    }
  };

  const handleCompleteWithdrawal = async (txId) => {
    setActionLoading(true);
    try {
      await axios.patch(`${API}/api/wallet/withdraw/${txId}/complete`, {}, { headers: adminHeaders() });
      showToast('Withdrawal completed successfully');
      fetchAll();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to complete withdrawal', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFailWithdrawal = async (txId) => {
    const reason = prompt('Enter reason for rejection:');
    if (!reason) return;
    
    setActionLoading(true);
    try {
      await axios.patch(`${API}/api/wallet/transaction/${txId}/fail`, { reason }, { headers: adminHeaders() });
      showToast('Withdrawal rejected successfully');
      fetchAll();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to reject withdrawal', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered disputes
  const filteredDisputes = disputes.filter(d => {
    if (statusFilter && d.status !== statusFilter) return false;
    if (flagFilter && d.autoFlag !== flagFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.orderId?.toLowerCase().includes(q) ||
        d.reason?.toLowerCase().includes(q) ||
        d.id?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleApproveKyc = async (id) => {
    try {
      setActionLoading(true);
      await axios.post(`/api/admin/kyc/${id}/approve`, {}, { headers: adminHeaders() });
      showToast('KYC Approved');
      fetchAll();
    } catch (e) {
      showToast('Failed to approve KYC', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectKyc = async (id) => {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      setActionLoading(true);
      await axios.post(`/api/admin/kyc/${id}/reject`, { reason }, { headers: adminHeaders() });
      showToast('KYC Rejected');
      fetchAll();
    } catch (e) {
      showToast('Failed to reject KYC', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserStatus = async (id, currentStatus) => {
    const action = currentStatus === 'suspended' ? 'activate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      setActionLoading(true);
      await axios.post(`/api/admin/users/${id}/${action}`, {}, { headers: adminHeaders() });
      showToast(`User ${action}d successfully`);
      fetchAll();
    } catch (e) {
      showToast(`Failed to ${action} user`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const autoFlagged = disputes.filter(d => d.autoFlag === 'AUTO_FLAGGED');
  const openDisputes = disputes.filter(d => d.status === 'OPEN');

  // Status bar colors
  const BAR_COLORS = {
    PLACED: 'bg-slate-400', ESCROW_FUNDED: 'bg-blue-500', ACCEPTED: 'bg-cyan-500',
    IN_PROGRESS: 'bg-indigo-500', SUBMITTED: 'bg-violet-500', APPROVED: 'bg-teal-500',
    COMPLETED: 'bg-emerald-500', RELEASED: 'bg-green-500', DISPUTED: 'bg-red-500',
    REFUNDED: 'bg-orange-500', CANCELLED: 'bg-gray-400', CHANGES_REQUESTED: 'bg-amber-500',
    REJECTED: 'bg-rose-500'
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-semibold">Loading Admin Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-inter">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Sidebar + Content Layout ── */}
      <div className="flex min-h-screen pt-[64px]">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-slate-200 flex-shrink-0 hidden md:flex flex-col p-4 gap-1 sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto">
          <div className="px-3 py-2 mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Panel</p>
          </div>
          {[
            { id: 'overview', icon: '📊', label: 'Overview' },
            { id: 'disputes', icon: '⚖️', label: 'Disputes', badge: openDisputes.length },
            { id: 'orders', icon: '📦', label: 'Orders' },
            { id: 'deeds', icon: '📜', label: 'Deeds' },
            { id: 'financials', icon: '💰', label: 'Financials' },
            { id: 'settlements', icon: '🏦', label: 'Settlements', badge: withdrawals.length },
            { id: 'kyc', icon: '🆔', label: 'KYC Queue', badge: kycQueue.length },
            { id: 'users', icon: '👥', label: 'Users' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === item.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === item.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          <div className="mt-auto pt-4 border-t border-slate-100">
            <button
              onClick={() => { localStorage.removeItem('adminToken'); localStorage.removeItem('adminData'); window.location.href = '/admin/login'; }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
            >
              <span>🚪</span> Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">

          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-black text-slate-800">Platform Overview</h1>
                <p className="text-slate-500 text-sm mt-1">Real-time analytics for the ScrowX marketplace</p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <StatCard label="Total Orders" value={stats?.totalOrders} icon="📦" accent="bg-indigo-50" sub="All time" />
                <StatCard label="Active Orders" value={stats?.activeOrders} icon="⚡" accent="bg-blue-50" sub="In progress" />
                <StatCard label="Completed" value={stats?.completedOrders} icon="✅" accent="bg-emerald-50" sub="Resolved" />
                <StatCard label="Total Disputes" value={stats?.totalDisputes} icon="⚖️" accent="bg-amber-50" sub="All disputes" />
                <StatCard label="Open Disputes" value={stats?.openDisputes} icon="🚨" accent="bg-red-50" highlight={stats?.openDisputes > 0} sub="Needs attention" />
              </div>

              {/* 2-col row: Status breakdown + Dispute summary */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Orders by status */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-base font-bold text-slate-800 mb-1">Orders by Status</h2>
                  <p className="text-xs text-slate-400 mb-5">Distribution across all pipeline stages</p>
                  <div className="space-y-3">
                    {stats?.ordersByStatus?.length > 0
                      ? stats.ordersByStatus
                          .sort((a, b) => b.count - a.count)
                          .map(s => (
                            <StatusBar
                              key={s.status}
                              label={s.status}
                              count={parseInt(s.count)}
                              total={stats.totalOrders}
                              color={BAR_COLORS[s.status] || 'bg-slate-400'}
                            />
                          ))
                      : <p className="text-slate-400 text-sm">No orders yet</p>
                    }
                  </div>
                </div>

                {/* Dispute summary */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-base font-bold text-slate-800 mb-1">Dispute Health</h2>
                  <p className="text-xs text-slate-400 mb-5">Current dispute resolution metrics</p>
                  <div className="space-y-4">
                    {[
                      { label: 'Open',         value: stats?.openDisputes,       color: 'bg-red-500' },
                      { label: 'Under Review', value: stats?.underReviewDisputes,color: 'bg-amber-500' },
                      { label: 'Resolved',     value: stats?.resolvedDisputes,   color: 'bg-emerald-500' },
                    ].map(item => (
                      <StatusBar
                        key={item.label}
                        label={item.label}
                        count={item.value || 0}
                        total={stats?.totalDisputes || 1}
                        color={item.color}
                      />
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-black text-slate-800">{stats?.totalBuyers ?? 0}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Buyers</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-black text-slate-800">{stats?.totalSellers ?? 0}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Sellers</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AUTO-FLAGGED disputes section */}
              <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 bg-red-50/60">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🚨</span>
                    <div>
                      <h2 className="text-base font-bold text-red-700">Auto-Flagged Disputes</h2>
                      <p className="text-xs text-red-500">High-risk orders that require immediate attention</p>
                    </div>
                  </div>
                  <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">{autoFlagged.length}</span>
                </div>
                {autoFlagged.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-sm">
                    <div className="text-3xl mb-2">✅</div>
                    No auto-flagged disputes
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {autoFlagged.slice(0, 8).map(d => (
                      <div key={d.id} className="flex items-center gap-4 px-6 py-3 hover:bg-red-50/30 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            Order <span className="font-mono text-slate-500">#{d.orderId?.slice(0, 8)}</span>
                          </p>
                          <p className="text-xs text-slate-500">{d.reason} · {d.riskReason}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-slate-400">{fmtDate(d.createdAt)}</p>
                          <span className={`text-xs font-bold ${d.riskScore >= 75 ? 'text-red-600' : 'text-amber-600'}`}>
                            Risk {d.riskScore}%
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/admin/dispute/${d.id}`)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex-shrink-0"
                        >
                          View →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DISPUTES TAB ── */}
          {tab === 'disputes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-800">Dispute Management</h1>
                  <p className="text-slate-500 text-sm mt-1">{filteredDisputes.length} dispute{filteredDisputes.length !== 1 ? 's' : ''} found</p>
                </div>
                <button
                  onClick={fetchAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  ↻ Refresh
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Search by order ID or reason..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <select
                  value={flagFilter}
                  onChange={e => setFlagFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">All Flags</option>
                  <option value="AUTO_FLAGGED">Auto-Flagged</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>

              {/* Dispute table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {filteredDisputes.length === 0 ? (
                  <div className="p-16 text-center text-slate-400">
                    <div className="text-5xl mb-3">⚖️</div>
                    <p className="font-semibold text-slate-600">No disputes found</p>
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Order</th>
                          <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                          <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                          <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Flag</th>
                          <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Risk</th>
                          <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                          <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredDisputes.map(d => (
                          <tr key={d.id} className={`hover:bg-slate-50/70 transition-colors ${d.autoFlag === 'AUTO_FLAGGED' ? 'bg-red-50/20' : ''}`}>
                            <td className="px-5 py-4">
                              <p className="font-mono text-xs text-slate-600">#{d.orderId?.slice(0, 8)}</p>
                              <p className="text-xs text-slate-400 mt-0.5">${d.order?.scopeBox?.price || 0} {d.order?.currency || 'USD'}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-slate-700 font-medium">{d.reason}</p>
                              <p className="text-xs text-slate-400 truncate max-w-[160px]">{d.description}</p>
                            </td>
                            <td className="px-5 py-4 font-bold text-slate-800">
                              ${d.order?.scopeBox?.price || 0}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge status={d.status} />
                            </td>
                            <td className="px-5 py-4">
                              <RiskBadge score={d.riskScore} flag={d.autoFlag} />
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${d.riskScore >= 75 ? 'bg-red-500' : d.riskScore >= 50 ? 'bg-amber-500' : 'bg-slate-400'}`}
                                    style={{ width: `${d.riskScore}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold ${d.riskScore >= 75 ? 'text-red-600' : d.riskScore >= 50 ? 'text-amber-600' : 'text-slate-500'}`}>
                                  {d.riskScore}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-400">{fmtDate(d.createdAt)}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => navigate(`/admin/dispute/${d.id}`)}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                                >
                                  View
                                </button>
                                {d.status === 'OPEN' && (
                                  <button
                                    onClick={() => { setResolving(d.id); setResolveAction(''); setResolveNotes(''); }}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                                  >
                                    Resolve
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ORDERS TAB ── */}
          {tab === 'orders' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-800">All Orders</h1>
                <p className="text-slate-500 text-sm mt-1">{orders.length} orders on the platform</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {orders.length === 0 ? (
                  <div className="p-16 text-center text-slate-400">
                    <div className="text-5xl mb-3">📦</div>
                    <p className="font-semibold">No orders yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                          <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Buyer</th>
                          <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Service</th>
                          <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                          <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.map(o => (
                          <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-4 font-mono text-xs text-slate-600">#{o.id?.slice(0, 8)}</td>
                            <td className="px-5 py-4 text-slate-700 font-medium text-xs">{o.buyerName || '—'}</td>
                            <td className="px-5 py-4 text-slate-600 text-xs">{o.scopeBox?.productType || o.scopeBox?.title || '—'}</td>
                            <td className="px-5 py-4 font-bold text-slate-800">${o.scopeBox?.price || 0}</td>
                            <td className="px-5 py-4"><StatusBadge status={o.status} /></td>
                            <td className="px-5 py-4 text-xs text-slate-400">{fmtDate(o.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* ── SETTLEMENTS TAB ── */}
          {tab === 'settlements' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-800">Pending Settlements</h1>
                <p className="text-slate-500 text-sm mt-1">Review and process seller withdrawal requests</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {withdrawals.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <div className="text-4xl mb-3">💸</div>
                    <p className="font-medium">No pending withdrawal requests</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                          <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Seller / Wallet</th>
                          <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                          <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Bank Details</th>
                          <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {withdrawals.map(w => (
                          <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-4 text-xs text-slate-400">{fmtDate(w.createdAt)}<br/>{fmtTime(w.createdAt)}</td>
                            <td className="px-5 py-4 text-slate-700 font-medium text-xs">
                              {w.wallet?.userId?.slice(0, 8)}... <span className="text-[10px] text-slate-400">({w.wallet?.userRole})</span>
                            </td>
                            <td className="px-5 py-4 font-bold text-slate-800">${w.amount || 0}</td>
                            <td className="px-5 py-4 text-xs text-slate-600 max-w-xs truncate">
                              {w.metadata?.bankDetails ? JSON.stringify(w.metadata.bankDetails) : 'N/A'}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleCompleteWithdrawal(w.id)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                                >
                                  Complete
                                </button>
                                <button 
                                  onClick={() => handleFailWithdrawal(w.id)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* ── KYC QUEUE TAB ── */}
          {tab === 'kyc' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-800">KYC Queue</h1>
                <p className="text-slate-500 text-sm mt-1">Review pending identity verifications</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {kycQueue.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <div className="text-4xl mb-3">🆔</div>
                    <p className="font-medium">No pending KYC submissions</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                          <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">User ID</th>
                          <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Doc Type</th>
                          <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Documents</th>
                          <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {kycQueue.map(k => (
                          <tr key={k.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-4 text-xs text-slate-400">{fmtDate(k.submittedAt)}<br/>{fmtTime(k.submittedAt)}</td>
                            <td className="px-5 py-4 text-slate-700 font-medium text-xs font-mono">{k.userId?.slice(0, 8)}...</td>
                            <td className="px-5 py-4 font-bold text-slate-800">{k.idDocType}</td>
                            <td className="px-5 py-4 text-xs text-slate-600">
                              <div className="flex gap-2">
                                {k.idDocUrls.map((url, i) => (
                                  <a key={i} href={`${import.meta.env.VITE_API_URL}${url}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                    Doc {i + 1}
                                  </a>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleApproveKyc(k.id)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleRejectKyc(k.id)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── USERS TAB ── */}
          {tab === 'users' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-800">User Management</h1>
                <p className="text-slate-500 text-sm mt-1">Manage buyers and sellers across the platform</p>
              </div>

              {/* Buyers Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h2 className="text-lg font-bold text-slate-800">Buyers ({users.buyers.length})</h2>
                </div>
                {users.buyers.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No buyers found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="px-6 py-3">Name</th>
                          <th className="px-6 py-3">Email</th>
                          <th className="px-6 py-3">Joined</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {users.buyers.map(b => (
                          <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-900">{b.firstName} {b.lastName}</td>
                            <td className="px-6 py-4 text-slate-500">{b.email}</td>
                            <td className="px-6 py-4 text-slate-500">{fmtDate(b.createdAt)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${b.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handleUserStatus(b.id, b.status)}
                                disabled={actionLoading}
                                className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-colors disabled:opacity-50 ${b.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                              >
                                {b.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sellers Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h2 className="text-lg font-bold text-slate-800">Sellers ({users.sellers.length})</h2>
                </div>
                {users.sellers.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No sellers found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="px-6 py-3">Business / Name</th>
                          <th className="px-6 py-3">Email</th>
                          <th className="px-6 py-3">Joined</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {users.sellers.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              {s.businessName || `${s.firstName} ${s.lastName}`}
                            </td>
                            <td className="px-6 py-4 text-slate-500">{s.email}</td>
                            <td className="px-6 py-4 text-slate-500">{fmtDate(s.createdAt)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handleUserStatus(s.id, s.status)}
                                disabled={actionLoading}
                                className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-colors disabled:opacity-50 ${s.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                              >
                                {s.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── FINANCIALS TAB ── */}
          {tab === 'financials' && financials && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-800">Financial Reports</h1>
                <p className="text-slate-500 text-sm mt-1">Platform revenue, escrow volume, and transaction logs</p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard 
                  label="Total Escrow Volume" 
                  value={`₹${financials.totalEscrowVolume.toLocaleString()}`} 
                  icon="💸" 
                  accent="bg-indigo-50" 
                  sub="All-time locked volume" 
                />
                <StatCard 
                  label="Active Escrow Balance" 
                  value={`₹${financials.totalActiveEscrow.toLocaleString()}`} 
                  icon="🏦" 
                  accent="bg-blue-50" 
                  sub="Currently locked in escrow" 
                />
                <StatCard 
                  label="Est. Platform Revenue" 
                  value={`₹${financials.totalPlatformRevenue.toLocaleString()}`} 
                  icon="📈" 
                  accent="bg-emerald-50" 
                  sub="5% fee on released funds" 
                />
              </div>

              {/* Bar Chart (Simplified using DOM elements) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Revenue Over Time (Last 30 Days)</h2>
                {financials.revenueOverTime.length === 0 ? (
                  <p className="text-slate-500 text-sm">No revenue data found for the past 30 days.</p>
                ) : (
                  <div className="h-48 flex items-end gap-2 overflow-x-auto pb-2">
                    {financials.revenueOverTime.map(d => {
                      const maxVol = Math.max(...financials.revenueOverTime.map(r => r.volume), 1);
                      const heightPct = (d.volume / maxVol) * 100;
                      return (
                        <div key={d.date} className="flex flex-col items-center justify-end flex-1 min-w-[30px] group relative">
                          {/* Tooltip */}
                          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                            {d.date}<br/>Vol: ₹{d.volume}
                          </div>
                          <div 
                            className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors" 
                            style={{ height: `${heightPct}%`, minHeight: '4px' }} 
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Transaction Log */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">Recent Transactions</h2>
                  <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded">Latest 50</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-3">TxID / Ref</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {financials.recentTransactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono text-slate-600">{tx.id.substring(0,8)}</span>
                            {tx.reference && <div className="text-xs text-slate-400 mt-0.5">Ref: {tx.reference.substring(0,8)}</div>}
                          </td>
                          <td className="px-6 py-4 text-slate-500">{fmtDate(tx.createdAt)} {fmtTime(tx.createdAt)}</td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-700">{tx.category.replace(/_/g, ' ')}</span>
                            <div className="text-xs text-slate-400 mt-0.5">{tx.type}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-bold ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-800'}`}>
                              {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                              tx.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 
                              tx.status === 'FAILED' ? 'bg-red-100 text-red-700' : 
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── DEEDS TAB ── */}
          {tab === 'deeds' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-800">Deed Management</h1>
                <p className="text-slate-500 text-sm mt-1">Smart contracts and milestone tracking</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h2 className="text-lg font-bold text-slate-800">Recent Deeds</h2>
                </div>
                {deeds.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-sm">No deeds found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="px-6 py-3">Deed ID / Title</th>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Value</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Milestones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {deeds.map(deed => (
                          <tr key={deed.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-900 truncate max-w-[200px]" title={deed.title}>{deed.title}</div>
                              <div className="font-mono text-xs text-slate-400 mt-1">{deed.id.substring(0, 8)}...</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-semibold">{deed.transactionType}</span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-800">
                              {deed.currency} {deed.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={deed.status} />
                            </td>
                            <td className="px-6 py-4 text-xs">
                              {deed.isMilestone ? (
                                <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded">
                                  {deed.milestones?.length || 0} stages
                                </span>
                              ) : (
                                <span className="text-slate-400">Standard</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Resolution Modal ── */}
      {resolving && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Resolve Dispute</h3>
              <button onClick={() => setResolving(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500">Choose a resolution action for this dispute.</p>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setResolveAction('REFUND')}
                  className={`p-4 rounded-xl border-2 text-sm font-bold transition-all ${resolveAction === 'REFUND' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-600 hover:border-red-300'}`}
                >
                  <div className="text-2xl mb-1">↩️</div>
                  Refund Buyer
                </button>
                <button
                  onClick={() => setResolveAction('RELEASE')}
                  className={`p-4 rounded-xl border-2 text-sm font-bold transition-all ${resolveAction === 'RELEASE' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-emerald-300'}`}
                >
                  <div className="text-2xl mb-1">✅</div>
                  Release to Seller
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Resolution Notes (optional)</label>
                <textarea
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes about your decision..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={handleResolve}
                disabled={!resolveAction || resolveLoading}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${resolveAction === 'REFUND' ? 'bg-red-600 hover:bg-red-700 text-white' : resolveAction === 'RELEASE' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-200 text-slate-500'}`}
              >
                {resolveLoading ? 'Processing...' : resolveAction === 'REFUND' ? 'Confirm Refund' : resolveAction === 'RELEASE' ? 'Confirm Release' : 'Select Action'}
              </button>
              <button onClick={() => setResolving(null)} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}