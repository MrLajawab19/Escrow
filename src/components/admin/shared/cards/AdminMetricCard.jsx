import React, { memo } from 'react';

function AdminMetricCard({ label, value, icon: Icon, colorClass, highlight, trend }) {
  return (
    <div className={`relative overflow-hidden bg-white rounded-2xl border ${highlight ? 'border-red-200 shadow-red-100/50 shadow-lg' : 'border-slate-200 shadow-sm'} p-6 transition-all duration-300 hover:shadow-md group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
          <p className={`text-3xl font-black ${highlight ? 'text-red-600' : 'text-slate-800'}`}>{value ?? '—'}</p>
          
          {trend && (
            <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              <span>{trend > 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}%</span>
              <span className="text-slate-400 font-normal ml-1">vs last month</span>
            </div>
          )}
        </div>
        
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${colorClass}`}>
          {Icon && <Icon size={24} className="opacity-90" />}
        </div>
      </div>
      
      {highlight && (
        <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-red-400 to-red-600" />
      )}
    </div>
  );
}

export default memo(AdminMetricCard);
