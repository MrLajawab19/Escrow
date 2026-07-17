import React, { memo } from 'react';

function AdminStatusBadge({ status }) {
  const STATUS_META = {
    PLACED:            { color: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400' },
    ESCROW_FUNDED:     { color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500' },
    ACCEPTED:          { color: 'bg-cyan-100 text-cyan-700',      dot: 'bg-cyan-500' },
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
    OPEN:              { color: 'bg-red-100 text-red-700',        dot: 'bg-red-500' },
    CHALLENGE:         { color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500' },
    ESCALATED:         { color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-500' },
    RESOLVED:          { color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500' },
  };

  const meta = STATUS_META[status] || { color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export function AdminRiskBadge({ score, flag }) {
  if (flag !== 'AUTO_FLAGGED') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 text-slate-500">
      Manual
    </span>
  );
  const color = score >= 75 ? 'bg-red-50 text-red-700 border border-red-200'
    : score >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200'
    : 'bg-orange-50 text-orange-700 border border-orange-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${color}`}>
      ⚑ AUTO-FLAGGED
    </span>
  );
}

export default memo(AdminStatusBadge);
