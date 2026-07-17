import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, AlertTriangle, Eye, ShieldAlert } from 'lucide-react';
import AdminTable from '../shared/tables/AdminTable';
import AdminPagination from '../shared/tables/AdminPagination';
import AdminStatusBadge, { AdminRiskBadge } from '../shared/AdminStatusBadge';
import { fmtDate } from '../utils/format';

function DisputesTab({
  disputes,
  disputesLoading,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  flagFilter,
  setFlagFilter,
  staleFilter,
  setStaleFilter,
  disputesPage,
  setDisputesPage,
  totalDisputes,
  setResolving
}) {
  const navigate = useNavigate();

  const headers = [
    { label: 'Order / ID' },
    { label: 'Buyer / Seller' },
    { label: 'Reason' },
    { label: 'Status' },
    { label: 'AI Risk' },
    { label: 'Age' },
    { label: 'Actions', align: 'right' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      {/* Header & Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Dispute Management</h1>
          <p className="text-slate-500 text-sm mt-1">Review, mediate, and resolve active escrow disputes.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search order ID or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="CHALLENGE">Challenge</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          
          <select 
            value={flagFilter} 
            onChange={(e) => setFlagFilter(e.target.value)} 
            className="bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="">All Risk Flags</option>
            <option value="AUTO_FLAGGED">Auto-Flagged (AI)</option>
            <option value="MANUAL">Manual Flags</option>
          </select>
          
          <label className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${staleFilter ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            <input 
              type="checkbox" 
              checked={staleFilter} 
              onChange={(e) => setStaleFilter(e.target.checked)} 
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" 
            />
            <AlertTriangle size={16} className={staleFilter ? 'text-amber-600' : 'text-slate-400'} />
            Stale (48h+)
          </label>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        <AdminTable 
          headers={headers} 
          loading={disputesLoading} 
          isEmpty={disputes.length === 0}
          emptyMessage="No disputes found matching your criteria."
        >
          {disputes.map(d => {
            const ageHours = Math.floor((new Date() - new Date(d.createdAt)) / (1000 * 60 * 60));
            const isStale = ageHours >= 48 && d.status !== 'RESOLVED';
            
            return (
              <tr key={d.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-800 font-mono">#{d.order?.id?.slice(0,8) || 'N/A'}</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{fmtDate(d.createdAt)}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-slate-700 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded w-11 text-center">BUYER</span>
                      <span className="font-medium truncate max-w-[120px]">{d.order?.buyer?.firstName || 'Unknown'}</span>
                    </p>
                    <p className="text-sm text-slate-700 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded w-11 text-center">SELLER</span>
                      <span className="font-medium truncate max-w-[120px]">{d.order?.seller?.firstName || 'Unknown'}</span>
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 max-w-[240px]">
                  <p className="text-sm text-slate-700 font-medium truncate" title={d.reason}>{d.reason}</p>
                </td>
                <td className="px-6 py-4">
                  <AdminStatusBadge status={d.status} />
                </td>
                <td className="px-6 py-4">
                  <AdminRiskBadge score={d.aiRiskScore} flag={d.flagReason} />
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold ${isStale ? 'bg-red-50 text-red-600' : 'text-slate-600'}`}>
                    {isStale && <ShieldAlert size={14} />}
                    {ageHours}h
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => navigate(`/admin/dispute/${d.id}`)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    {d.status !== 'RESOLVED' && (
                      <button 
                        onClick={() => setResolving(d.id)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminTable>
        
        <AdminPagination 
          currentPage={disputesPage} 
          totalItems={totalDisputes} 
          onPageChange={setDisputesPage} 
        />
      </div>
    </div>
  );
}

export default memo(DisputesTab);