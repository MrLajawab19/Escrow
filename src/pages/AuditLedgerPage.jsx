import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ShieldCheck, Server, AlertTriangle, Fingerprint } from 'lucide-react';

const AuditLedgerPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [deed, setDeed] = useState(null);
  const [loading, setLoading] = useState(true);

  const userType = location.pathname.includes('/seller/') ? 'seller' : 'buyer';
  const token = localStorage.getItem(`${userType}Token`);

  useEffect(() => {
    fetchDeed();
  }, [id]);

  const fetchDeed = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/deeds/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeed(res.data.data);
    } catch (err) {
      toast.error('Failed to load audit ledger');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading ledger...</div>;
  if (!deed || !deed.ledgerEntries) return null;

  // Verify chain integrity
  let isChainValid = true;
  for (let i = 1; i < deed.ledgerEntries.length; i++) {
    if (deed.ledgerEntries[i].prevEntryHash !== deed.ledgerEntries[i - 1].entryHash) {
      isChainValid = false;
      break;
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-inter flex items-center gap-2">
              <Server className="w-6 h-6 text-indigo-400" /> Immutable Audit Ledger
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
              <span className="font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{deed.id.substring(0, 8)}...</span>
              Cryptographic event chain for this transaction.
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold ${isChainValid ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>
            {isChainValid ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {isChainValid ? 'Chain Valid' : 'Chain Broken'}
          </div>
        </div>

        {/* Ledger Entries */}
        <div className="p-6 sm:p-8">
          <div className="relative border-l-2 border-indigo-100 ml-4 space-y-8 pb-4">
            {deed.ledgerEntries.map((entry, idx) => (
              <div key={entry.id} className="relative pl-8">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white"></div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded mb-2">
                        {entry.action}
                      </span>
                      <p className="text-sm text-gray-500">
                        Actor: <span className="font-semibold text-gray-700">{entry.actorRole}</span> ({entry.actorId.substring(0, 8)}...)
                      </p>
                    </div>
                    <span className="text-xs font-mono text-gray-400">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {entry.details && Object.keys(entry.details).length > 0 && (
                    <div className="bg-white p-3 rounded border border-slate-100 mb-4 text-xs font-mono text-gray-600 overflow-x-auto">
                      <pre>{JSON.stringify(entry.details, null, 2)}</pre>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
                    <div className="bg-slate-100 p-2 rounded text-slate-500 break-all">
                      <div className="font-semibold text-slate-400 flex items-center gap-1 mb-1">
                        <Fingerprint className="w-3 h-3" /> Hash
                      </div>
                      {entry.entryHash}
                    </div>
                    {entry.prevEntryHash && (
                      <div className="bg-slate-100 p-2 rounded text-slate-500 break-all">
                        <div className="font-semibold text-slate-400 flex items-center gap-1 mb-1">
                          <Fingerprint className="w-3 h-3" /> Prev Hash
                        </div>
                        {entry.prevEntryHash}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLedgerPage;
