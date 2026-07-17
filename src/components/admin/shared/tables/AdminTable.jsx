import React, { memo } from 'react';

function AdminTable({ headers, children, loading, loadingMessage, emptyMessage, isEmpty }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
              {headers.map((h, i) => (
                <th key={i} className={`px-6 py-4 whitespace-nowrap ${h.align === 'right' ? 'text-right' : ''}`}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 relative">
            {loading ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-20 text-center">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm font-medium text-slate-500">{loadingMessage || 'Loading data...'}</p>
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-20 text-center">
                  <p className="text-sm font-medium text-slate-500">{emptyMessage || 'No records found.'}</p>
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default memo(AdminTable);
