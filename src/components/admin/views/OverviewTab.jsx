import React from 'react';
import { Package, Zap, CheckCircle2, Scale } from 'lucide-react';
import AdminMetricCard from '../shared/cards/AdminMetricCard';
import SystemHealth from '../shared/widgets/SystemHealth';
import AdminStatusBadge, { AdminRiskBadge } from '../shared/AdminStatusBadge';

export default function OverviewTab({ stats, disputes = [], setTab }) {
  const autoFlagged = disputes.filter(d => d.flagReason === 'AUTO_FLAGGED' && d.status !== 'RESOLVED');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Platform Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Real-time analytics for the ScrowX marketplace</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminMetricCard 
          label="Total Orders" 
          value={stats?.totalOrders} 
          icon={Package} 
          colorClass="bg-indigo-50 text-indigo-600" 
          trend={12.5}
        />
        <AdminMetricCard 
          label="Active Orders" 
          value={stats?.activeOrders} 
          icon={Zap} 
          colorClass="bg-amber-50 text-amber-600" 
          trend={5.2}
        />
        <AdminMetricCard 
          label="Completed Orders" 
          value={stats?.completedOrders} 
          icon={CheckCircle2} 
          colorClass="bg-emerald-50 text-emerald-600" 
          trend={18.1}
        />
        <AdminMetricCard 
          label="Total Disputes" 
          value={stats?.totalDisputes} 
          icon={Scale} 
          colorClass="bg-slate-50 text-slate-600" 
          highlight={stats?.openDisputes > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Required Widget */}
          {stats?.openDisputes > 0 && (
            <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm shadow-red-50 relative overflow-hidden flex items-center justify-between group cursor-pointer hover:shadow-md transition-all" onClick={() => setTab('disputes')}>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
              <div>
                <h3 className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  Action Required
                </h3>
                <p className="text-sm font-medium text-slate-700">
                  <span className="text-2xl font-black text-slate-900 mr-2">{stats.openDisputes}</span> 
                  Open disputes need attention
                </p>
              </div>
              <button className="px-4 py-2 bg-red-50 group-hover:bg-red-100 text-red-700 font-bold rounded-xl text-sm transition-colors flex items-center gap-2">
                Review Disputes
                <span className="text-lg">→</span>
              </button>
            </div>
          )}

          {/* Auto Flagged Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Priority AI Flags</h3>
              <button onClick={() => setTab('disputes')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View All</button>
            </div>
            
            {autoFlagged.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={24} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">No priority AI flags.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                      <th className="px-5 py-3">Order</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">AI Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {autoFlagged.slice(0, 5).map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-sm font-bold text-slate-800 font-mono">#{d.order?.id?.slice(0,8)}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{d.reason}</p>
                        </td>
                        <td className="px-5 py-3"><AdminStatusBadge status={d.status} /></td>
                        <td className="px-5 py-3"><AdminRiskBadge score={d.aiRiskScore} flag={d.flagReason} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-6">
          <SystemHealth stats={stats} />
        </div>
      </div>
    </div>
  );
}