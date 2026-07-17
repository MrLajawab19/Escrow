import React, { memo } from 'react';
import { DownloadCloud, FileSpreadsheet, FileText } from 'lucide-react';

function ReportsTab() {
  const reports = [
    { id: 1, name: 'Monthly Transaction Summary', type: 'CSV', lastGen: '2 hours ago' },
    { id: 2, name: 'Dispute Resolution Metrics', type: 'PDF', lastGen: 'Yesterday' },
    { id: 3, name: 'Active Escrow Holdings', type: 'CSV', lastGen: '3 days ago' },
    { id: 4, name: 'User Growth & KYC Report', type: 'PDF', lastGen: '1 week ago' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-full">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Reports & Exports</h1>
          <p className="text-slate-500 text-sm mt-1">Generate and download platform data for accounting and compliance.</p>
        </div>
        <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2">
          <DownloadCloud size={18} />
          Generate New Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between group hover:border-indigo-200 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.type === 'CSV' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {r.type === 'CSV' ? <FileSpreadsheet size={20} /> : <FileText size={20} />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{r.name}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Last generated: {r.lastGen}</p>
              </div>
            </div>
            <button className="p-2 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 rounded-lg transition-colors">
              <DownloadCloud size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(ReportsTab);