import React, { memo } from 'react';
import AdminTable from '../shared/tables/AdminTable';
import AdminPagination from '../shared/tables/AdminPagination';
import AdminStatusBadge from '../shared/AdminStatusBadge';
import { fmtDate, fmtCurrency } from '../utils/format';
import { MapPin, CheckCircle2 } from 'lucide-react';

function DeedsTab({
  deeds,
  deedsLoading,
  deedsPage,
  setDeedsPage,
  totalDeeds
}) {
  const headers = [
    { label: 'Deed / Title' },
    { label: 'Order ID' },
    { label: 'Value' },
    { label: 'Status' },
    { label: 'Milestones' },
    { label: 'Date', align: 'right' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Real Estate Deeds</h1>
          <p className="text-slate-500 text-sm mt-1">Manage escrow milestones for high-value transactions.</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <AdminTable 
          headers={headers} 
          loading={deedsLoading} 
          isEmpty={deeds.length === 0}
          emptyMessage="No deeds found."
        >
          {deeds.map(d => (
            <tr key={d.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
              <td className="px-6 py-4">
                <p className="font-mono text-[10px] font-bold text-slate-400 tracking-widest mb-1">#{d.id?.slice(0,8)}</p>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-indigo-500 mt-0.5" />
                  <p className="text-sm font-bold text-slate-700 leading-snug">{d.title}</p>
                </div>
              </td>
              <td className="px-6 py-4 font-mono text-sm font-bold text-slate-600">{d.orderId ? `#${d.orderId.slice(0,8)}` : 'N/A'}</td>
              <td className="px-6 py-4 text-sm font-black text-slate-800">{fmtCurrency(d.escrowAmount)}</td>
              <td className="px-6 py-4"><AdminStatusBadge status={d.status} /></td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg w-max">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  {d.milestones?.length || 0} Milestones
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-medium text-slate-500 text-right">{fmtDate(d.createdAt)}</td>
            </tr>
          ))}
        </AdminTable>
        
        <AdminPagination 
          currentPage={deedsPage} 
          totalItems={totalDeeds} 
          onPageChange={setDeedsPage} 
        />
      </div>
    </div>
  );
}

export default memo(DeedsTab);