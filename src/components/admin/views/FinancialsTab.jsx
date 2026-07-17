import React, { memo } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import AdminMetricCard from '../shared/cards/AdminMetricCard';
import { fmtCurrency } from '../utils/format';

function FinancialsTab({ financials }) {
  const stats = [
    { label: 'Total Revenue', value: fmtCurrency(financials?.totalRevenue), icon: DollarSign, colorClass: 'bg-emerald-50 text-emerald-600', trend: 15.2 },
    { label: 'Total Volume', value: fmtCurrency(financials?.totalVolume), icon: Activity, colorClass: 'bg-indigo-50 text-indigo-600', trend: 8.4 },
    { label: 'Platform Fees', value: fmtCurrency(financials?.totalFees), icon: ArrowUpRight, colorClass: 'bg-amber-50 text-amber-600', trend: 12.0 },
    { label: 'Escrow Holdings', value: fmtCurrency(financials?.escrowHoldings), icon: ArrowDownRight, colorClass: 'bg-blue-50 text-blue-600' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Financial Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Platform revenue, transaction volume, and escrow holdings.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <AdminMetricCard 
            key={i}
            label={s.label} 
            value={s.value} 
            icon={s.icon} 
            colorClass={s.colorClass} 
            trend={s.trend}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <Activity size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Revenue Chart</h3>
          <p className="text-sm text-slate-500 text-center max-w-sm">
            Detailed charting is currently not available. Integrate a charting library like Recharts to visualize historical data here.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Recent Transactions</h3>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 text-center py-8 border border-dashed border-slate-200 rounded-xl">No recent transactions to display.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(FinancialsTab);