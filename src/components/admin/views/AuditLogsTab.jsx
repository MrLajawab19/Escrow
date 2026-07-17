import React, { memo } from 'react';
import { ShieldAlert } from 'lucide-react';

function AuditLogsTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-full">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-black text-slate-800 tracking-tight">Audit Logs</h1>
        <p className="text-slate-500 text-sm mt-1">Immutable record of all admin and system activities.</p>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
          <ShieldAlert size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Audit Logs Coming Soon</h3>
        <p className="text-sm text-slate-500 max-w-md text-center">
          The security audit logging module is currently in development. It will track all privileged actions performed in this admin panel.
        </p>
      </div>
    </div>
  );
}

export default memo(AuditLogsTab);