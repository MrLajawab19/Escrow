
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import AdminLayout from './admin/layout/AdminLayout';

const OverviewTab = lazy(() => import('./admin/views/OverviewTab'));
const DisputesTab = lazy(() => import('./admin/views/DisputesTab'));
const OrdersTab = lazy(() => import('./admin/views/OrdersTab'));
const DeedsTab = lazy(() => import('./admin/views/DeedsTab'));
const FinancialsTab = lazy(() => import('./admin/views/FinancialsTab'));
const SettlementsTab = lazy(() => import('./admin/views/SettlementsTab'));
const KycQueueTab = lazy(() => import('./admin/views/KycQueueTab'));
const UsersTab = lazy(() => import('./admin/views/UsersTab'));
const AuditLogsTab = lazy(() => import('./admin/views/AuditLogsTab'));
const ReportsTab = lazy(() => import('./admin/views/ReportsTab'));
const SystemSettingsTab = lazy(() => import('./admin/views/SystemSettingsTab'));



import axios from 'axios';

// ─── helpers ────────────────────────────────────────────────────────────────
const adminHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deeds, setDeeds] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsPage, setWithdrawalsPage] = useState(1);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [disputesPage, setDisputesPage] = useState(1);
  const [totalDisputes, setTotalDisputes] = useState(0);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [deedsPage, setDeedsPage] = useState(1);
  const [totalDeeds, setTotalDeeds] = useState(0);
  const [deedsLoading, setDeedsLoading] = useState(false);
  const [kycPage, setKycPage] = useState(1);
  const [totalKyc, setTotalKyc] = useState(0);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycQueue, setKycQueue] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [buyersPage, setBuyersPage] = useState(1);
  const [totalBuyers, setTotalBuyers] = useState(0);
  const [buyersLoading, setBuyersLoading] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [sellersPage, setSellersPage] = useState(1);
  const [totalSellers, setTotalSellers] = useState(0);
  const [sellersLoading, setSellersLoading] = useState(false);
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview'); // 'overview' | 'disputes' | 'orders' | 'settlements'
  const [statusFilter, setStatusFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState('');
  const [staleFilter, setStaleFilter] = useState(false);
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
      const [statsRes, finRes] = await Promise.all([
        axios.get(`/api/admin/stats`, { headers: adminHeaders() }),
        axios.get(`/api/admin/financials`, { headers: adminHeaders() }),
      ]);
      setStats(statsRes.data.data);
      setFinancials(finRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchWithdrawals = useCallback(async () => {
    setWithdrawalsLoading(true);
    try {
      const res = await axios.get(`/api/wallet/admin/withdrawals?page=${withdrawalsPage}&limit=20`, { headers: adminHeaders() });
      setWithdrawals(res.data.data.withdrawals || []);
      setTotalWithdrawals(res.data.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setWithdrawalsLoading(false);
    }
  }, [withdrawalsPage]);

  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

  const fetchDisputes = useCallback(async () => {
    setDisputesLoading(true);
    try {
      const res = await axios.get(`/api/admin/disputes?page=${disputesPage}&limit=20&search=${search}&status=${statusFilter}&flag=${flagFilter}${staleFilter ? '&stale=true' : ''}`, { headers: adminHeaders() });
      setDisputes(res.data.data.disputes || []);
      setTotalDisputes(res.data.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setDisputesLoading(false);
    }
  }, [disputesPage, search, statusFilter, flagFilter]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  useEffect(() => {
    setDisputesPage(1);
  }, [search, statusFilter, flagFilter, staleFilter]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await axios.get(`/api/admin/orders?page=${ordersPage}&limit=20`, { headers: adminHeaders() });
      setOrders(res.data.data.orders || []);
      setTotalOrders(res.data.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  }, [ordersPage]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const fetchDeeds = useCallback(async () => {
    setDeedsLoading(true);
    try {
      const res = await axios.get(`/api/admin/deeds?page=${deedsPage}&limit=20`, { headers: adminHeaders() });
      setDeeds(res.data.data.deeds || []);
      setTotalDeeds(res.data.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setDeedsLoading(false);
    }
  }, [deedsPage]);

  useEffect(() => { fetchDeeds(); }, [fetchDeeds]);

  const fetchKyc = useCallback(async () => {
    setKycLoading(true);
    try {
      const res = await axios.get(`/api/admin/kyc?page=${kycPage}&limit=20`, { headers: adminHeaders() });
      setKycQueue(res.data.data.pendingKyc || []);
      setTotalKyc(res.data.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setKycLoading(false);
    }
  }, [kycPage]);

  useEffect(() => { fetchKyc(); }, [fetchKyc]);

  const fetchBuyers = useCallback(async () => {
    setBuyersLoading(true);
    try {
      const res = await axios.get(`/api/admin/buyers?page=${buyersPage}&limit=20`, { headers: adminHeaders() });
      setBuyers(res.data.data.buyers || []);
      setTotalBuyers(res.data.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setBuyersLoading(false);
    }
  }, [buyersPage]);

  useEffect(() => { fetchBuyers(); }, [fetchBuyers]);

  const fetchSellers = useCallback(async () => {
    setSellersLoading(true);
    try {
      const res = await axios.get(`/api/admin/sellers?page=${sellersPage}&limit=20`, { headers: adminHeaders() });
      setSellers(res.data.data.sellers || []);
      setTotalSellers(res.data.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setSellersLoading(false);
    }
  }, [sellersPage]);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);

  const handleResolve = async () => {
    if (!resolveAction || !resolving) return;
    setResolveLoading(true);
    try {
      await axios.post(`/api/admin/disputes/${resolving}/resolve`,
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
      await axios.patch(`/api/wallet/withdraw/${txId}/complete`, {}, { headers: adminHeaders() });
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
      await axios.patch(`/api/wallet/transaction/${txId}/fail`, { reason }, { headers: adminHeaders() });
      showToast('Withdrawal rejected successfully');
      fetchAll();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to reject withdrawal', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered disputes
  const filteredDisputes = disputes;

  const handleKycAction = async (id, action) => {
    if (action === 'APPROVED') {
      try {
        setActionLoading(true);
        await axios.post(`/api/admin/kyc/${id}/approve`, {}, { headers: adminHeaders() });
        showToast('KYC Approved');
        fetchKyc();
      } catch (e) {
        showToast('Failed to approve KYC', 'error');
      } finally {
        setActionLoading(false);
      }
    } else if (action === 'REJECTED') {
      const reason = window.prompt("Enter rejection reason:");
      if (!reason) return;
      try {
        setActionLoading(true);
        await axios.post(`/api/admin/kyc/${id}/reject`, { reason }, { headers: adminHeaders() });
        showToast('KYC Rejected');
        fetchKyc();
      } catch (e) {
        showToast('Failed to reject KYC', 'error');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleUserStatus = async (id, currentStatus) => {
    const action = currentStatus === 'suspended' ? 'activate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      setActionLoading(true);
      await axios.post(`/api/admin/users/${id}/${action}`, {}, { headers: adminHeaders() });
      showToast(`User ${action}d successfully`);
      fetchBuyers();
      fetchSellers();
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

  const renderTabContent = () => {
    switch(tab) {
      case 'overview': return <OverviewTab stats={stats} orders={orders} disputes={disputes} setTab={setTab} />;
      case 'disputes': return <DisputesTab disputes={disputes} disputesLoading={disputesLoading} search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} flagFilter={flagFilter} setFlagFilter={setFlagFilter} staleFilter={staleFilter} setStaleFilter={setStaleFilter} disputesPage={disputesPage} setDisputesPage={setDisputesPage} totalDisputes={totalDisputes} setResolving={setResolving} />;
      case 'orders': return <OrdersTab orders={orders} ordersLoading={ordersLoading} ordersPage={ordersPage} setOrdersPage={setOrdersPage} totalOrders={totalOrders} />;
      case 'deeds': return <DeedsTab deeds={deeds} deedsLoading={deedsLoading} deedsPage={deedsPage} setDeedsPage={setDeedsPage} totalDeeds={totalDeeds} />;
      case 'financials': return <FinancialsTab financials={financials} />;
      case 'settlements': return <SettlementsTab withdrawals={withdrawals} withdrawalsLoading={withdrawalsLoading} withdrawalsPage={withdrawalsPage} setWithdrawalsPage={setWithdrawalsPage} totalWithdrawals={totalWithdrawals} />;
      case 'kyc': return <KycQueueTab kycQueue={kycQueue} kycLoading={kycLoading} kycPage={kycPage} setKycPage={setKycPage} totalKyc={totalKyc} handleKycAction={handleKycAction} actionLoading={actionLoading} />;
      case 'users': return <UsersTab buyers={buyers} buyersLoading={buyersLoading} buyersPage={buyersPage} setBuyersPage={setBuyersPage} totalBuyers={totalBuyers} sellers={sellers} sellersLoading={sellersLoading} sellersPage={sellersPage} setSellersPage={setSellersPage} totalSellers={totalSellers} />;
      case 'audit': return <AuditLogsTab />;
      case 'reports': return <ReportsTab />;
      case 'settings': return <SystemSettingsTab />;
      default: return <OverviewTab stats={stats} />;
    }
  };

  const adminDataStr = localStorage.getItem('adminData');
  const adminData = adminDataStr ? JSON.parse(adminDataStr) : null;

  return (
    <AdminLayout 
      activeTab={tab} 
      onTabChange={setTab} 
      adminData={adminData} 
      onLogout={() => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = '/';
      }}
    >
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.msg}
        </div>
      )}
      {resolving && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Resolve Dispute</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Resolution Action</label>
                <select 
                  value={resolveAction} 
                  onChange={(e) => setResolveAction(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">Select Action...</option>
                  <option value="RELEASE">Release to Seller (Seller Wins)</option>
                  <option value="REFUND">Refund to Buyer (Buyer Wins)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin Notes (Required)</label>
                <textarea 
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  rows="3"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  placeholder="Explain the reason for this resolution..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => { setResolving(null); setResolveAction(''); setResolveNotes(''); }}
                className="px-4 py-2 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                disabled={resolveLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleResolve}
                disabled={!resolveAction || !resolveNotes.trim() || resolveLoading}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
              >
                {resolveLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : null}
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
      <Suspense fallback={<div className="flex h-[80vh] items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}>
        {renderTabContent()}
      </Suspense>
    </AdminLayout>
  );
}
