import React, { memo } from 'react';
import { Banknote, CheckCircle, XCircle } from 'lucide-react';
import AdminTable from '../shared/tables/AdminTable';
import AdminPagination from '../shared/tables/AdminPagination';
import { fmtDate, fmtCurrency } from '../utils/format';

function SettlementsTab({
  withdrawals,
  withdrawalsLoading,
  withdrawalsPage,
  setWithdrawalsPage,
  totalWithdrawals,
  handleCompleteWithdrawal,
  handleFailWithdrawal,
  actionLoading
}) {
  const headers = [
    { label: 'TX ID' },
    { label: 'User' },
    { label: 'Amount' },
    { label: 'Bank Details' },
    { label: 'Status' },
    { label: 'Date' },
    { label: 'Actions', align: 'right' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Withdrawals & Settlements</h1>
          <p className="text-slate-500 text-sm mt-1">Process user withdrawal requests and bank transfers.</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <AdminTable 
          headers={headers} 
          loading={withdrawalsLoading} 
          isEmpty={withdrawals.length === 0}
          emptyMessage="No withdrawal requests found."
        >
          {withdrawals.map(w => (
            <tr key={w.id} className="hover:bg-slate-50/80 transition-colors group">
              <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">#{w.id?.slice(0,8)}</td>
              <td className="px-6 py-4">
                <p className="text-sm font-bold text-slate-800">{w.user?.firstName} {w.user?.lastName}</p>
                <p className="text-xs text-slate-500">{w.user?.email}</p>
              </td>
              <td className="px-6 py-4 text-sm font-black text-slate-800">
                {fmtCurrency(Math.abs(w.amount))}
              </td>
              <td className="px-6 py-4">
                {w.bankDetails ? (
                  <div className="text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-[200px]">
                    <p className="truncate">Bank: {w.bankDetails.bankName}</p>
                    <p className="font-mono mt-0.5">{w.bankDetails.accountNumber}</p>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Not provided</span>
                )}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                  w.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                  w.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {w.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-medium text-slate-500">{fmtDate(w.createdAt)}</td>
              <td className="px-6 py-4 text-right">
                {w.status === 'PENDING' && (
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleCompleteWithdrawal?.(w.id)}
                      disabled={actionLoading}
                      className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                      title="Mark as Completed"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button 
                      onClick={() => handleFailWithdrawal?.(w.id)}
                      disabled={actionLoading}
                      className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                      title="Reject / Fail"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </AdminTable>
        
        <AdminPagination 
          currentPage={withdrawalsPage} 
          totalItems={totalWithdrawals} 
          onPageChange={setWithdrawalsPage} 
        />
      </div>
    </div>
  );
}

export default memo(SettlementsTab);