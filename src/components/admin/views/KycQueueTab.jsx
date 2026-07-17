import React, { memo, useState } from 'react';
import { ShieldCheck, Clock, XCircle, Search, FileText, Check, X, Maximize2 } from 'lucide-react';
import AdminPagination from '../shared/tables/AdminPagination';
import { fmtDate } from '../utils/format';

function KycQueueTab({
  kycQueue,
  kycLoading,
  kycPage,
  setKycPage,
  totalKyc,
  handleKycAction,
  actionLoading
}) {
  const [previewDoc, setPreviewDoc] = useState(null);

  // Quick Stats
  const stats = [
    { label: 'Pending Verifications', value: totalKyc, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Avg. Review Time', value: '< 2 hrs', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      {/* Header & Stats */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">KYC Workspace</h1>
          <p className="text-slate-500 text-sm mt-1">Review applicant identities and approve access.</p>
          
          <div className="mt-6 flex flex-wrap gap-4">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}>
                  <s.icon size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                  <p className="text-lg font-black text-slate-800">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Applicant Queue</h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {kycLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm font-medium text-slate-500">Loading queue...</p>
              </div>
            </div>
          ) : kycQueue.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center p-8">
              <div>
                <ShieldCheck size={48} className="text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">Queue Empty</h3>
                <p className="text-sm text-slate-500">All users have been verified!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kycQueue.map(item => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                        {item.user?.firstName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{item.user?.firstName} {item.user?.lastName}</h4>
                        <p className="text-xs text-slate-500">{item.user?.email}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                      {item.userType}
                    </span>
                  </div>

                  <div className="mb-6 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Submitted: <span className="font-medium text-slate-700">{fmtDate(item.createdAt)}</span></p>
                    <button 
                      onClick={() => setPreviewDoc(`${import.meta.env.VITE_API_URL}${item.documentUrl}`)}
                      className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm group-hover:border-indigo-200"
                    >
                      <FileText size={16} />
                      Preview Document
                    </button>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleKycAction(item.id, 'APPROVED')}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-sm font-bold transition-colors border border-emerald-100 disabled:opacity-50"
                    >
                      <Check size={16} /> Approve
                    </button>
                    <button 
                      onClick={() => handleKycAction(item.id, 'REJECTED')}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors border border-red-100 disabled:opacity-50"
                    >
                      <X size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AdminPagination 
          currentPage={kycPage} 
          totalItems={totalKyc} 
          onPageChange={setKycPage} 
        />
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-8">
          <div className="bg-slate-900 rounded-3xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-700 relative">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center z-10 shadow-md">
              <h3 className="text-white font-bold flex items-center gap-2">
                <FileText size={18} className="text-indigo-400" />
                Document Preview
              </h3>
              <div className="flex items-center gap-3">
                <a 
                  href={previewDoc} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  title="Open in new tab"
                >
                  <Maximize2 size={16} />
                </a>
                <button 
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-900 flex items-center justify-center overflow-auto p-4">
              <img 
                src={previewDoc} 
                alt="KYC Document" 
                className="max-w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl border border-slate-700"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden flex-col items-center justify-center text-slate-500">
                <FileText size={48} className="mb-4 opacity-50" />
                <p>Cannot preview this file type directly.</p>
                <a href={previewDoc} target="_blank" rel="noreferrer" className="mt-4 text-indigo-400 hover:underline">Download / Open in new tab</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(KycQueueTab);