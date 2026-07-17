import React, { memo } from 'react';

function SystemHealth({ stats }) {
  const openDisputes = stats?.openDisputes || 0;
  const healthScore = openDisputes > 10 ? 'Warning' : openDisputes > 20 ? 'Critical' : 'Healthy';
  
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${healthScore === 'Healthy' ? 'bg-emerald-500' : healthScore === 'Warning' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
          Pipeline Health
        </h3>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${healthScore === 'Healthy' ? 'bg-emerald-50 text-emerald-700' : healthScore === 'Warning' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
          {healthScore}
        </span>
      </div>
      
      <div className="space-y-6 flex-1">
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Order Distribution</h4>
          <div className="space-y-3">
            <StatusBar label="PLACED" count={stats?.ordersByStatus?.find(s => s.status === 'PLACED')?._count || 0} total={stats?.totalOrders} color="bg-slate-400" />
            <StatusBar label="ESCROW FUNDED" count={stats?.ordersByStatus?.find(s => s.status === 'ESCROW_FUNDED')?._count || 0} total={stats?.totalOrders} color="bg-blue-500" />
            <StatusBar label="IN PROGRESS" count={stats?.ordersByStatus?.find(s => s.status === 'IN_PROGRESS')?._count || 0} total={stats?.totalOrders} color="bg-indigo-500" />
            <StatusBar label="COMPLETED" count={stats?.ordersByStatus?.find(s => s.status === 'COMPLETED')?._count || 0} total={stats?.totalOrders} color="bg-emerald-500" />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Dispute Health</h4>
          <div className="space-y-3">
            <StatusBar label="OPEN" count={stats?.disputesByStatus?.find(s => s.status === 'OPEN')?._count || 0} total={stats?.totalDisputes} color="bg-red-500" />
            <StatusBar label="CHALLENGE" count={stats?.disputesByStatus?.find(s => s.status === 'CHALLENGE')?._count || 0} total={stats?.totalDisputes} color="bg-amber-500" />
            <StatusBar label="RESOLVED" count={stats?.disputesByStatus?.find(s => s.status === 'RESOLVED')?._count || 0} total={stats?.totalDisputes} color="bg-green-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 group">
      <div className="w-28 text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">{label.replace(/_/g, ' ')}</div>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-10 text-right flex items-center justify-end gap-2">
        <span className="text-xs font-bold text-slate-700">{count}</span>
        <span className="text-[10px] font-medium text-slate-400 w-6">{pct}%</span>
      </div>
    </div>
  );
}

export default memo(SystemHealth);
