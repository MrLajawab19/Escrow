import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const adminHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtShort = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const STATUS_META = {
  PLACED:            { color: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400' },
  ESCROW_FUNDED:     { color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500' },
  IN_PROGRESS:       { color: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-500' },
  SUBMITTED:         { color: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-500' },
  COMPLETED:         { color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500' },
  DISPUTED:          { color: 'bg-red-100 text-red-700',        dot: 'bg-red-500' },
  REFUNDED:          { color: 'bg-orange-100 text-orange-700',  dot: 'bg-orange-500' },
  CANCELLED:         { color: 'bg-gray-100 text-gray-500',      dot: 'bg-gray-400' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

// Timeline event icon/color mapping
function timelineIcon(event) {
  const e = (event || '').toUpperCase();
  if (e.includes('CREATED') || e.includes('PLACED'))             return { icon: '🆕', color: 'bg-blue-100 border-blue-300', text: 'text-blue-700' };
  if (e.includes('ESCROW') || e.includes('FUNDED'))              return { icon: '🔒', color: 'bg-indigo-100 border-indigo-300', text: 'text-indigo-700' };
  if (e.includes('ACCEPTED'))                                     return { icon: '✅', color: 'bg-teal-100 border-teal-300', text: 'text-teal-700' };
  if (e.includes('STARTED') || e.includes('IN_PROGRESS'))        return { icon: '⚙️', color: 'bg-violet-100 border-violet-300', text: 'text-violet-700' };
  if (e.includes('SUBMITTED') || e.includes('DELIVERY'))         return { icon: '📦', color: 'bg-purple-100 border-purple-300', text: 'text-purple-700' };
  if (e.includes('APPROVED'))                                     return { icon: '👍', color: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-700' };
  if (e.includes('DISPUTE'))                                      return { icon: '⚠️', color: 'bg-red-100 border-red-300', text: 'text-red-700' };
  if (e.includes('RESOLVED'))                                     return { icon: '⚖️', color: 'bg-green-100 border-green-300', text: 'text-green-700' };
  if (e.includes('EVIDENCE'))                                     return { icon: '📎', color: 'bg-amber-100 border-amber-300', text: 'text-amber-700' };
  if (e.includes('STATUS'))                                       return { icon: '🔄', color: 'bg-slate-100 border-slate-300', text: 'text-slate-600' };
  if (e.includes('REFUND') || e.includes('CANCEL'))              return { icon: '↩️', color: 'bg-orange-100 border-orange-300', text: 'text-orange-700' };
  if (e.includes('COMPLETED') || e.includes('RELEASED'))         return { icon: '🎉', color: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-700' };
  return { icon: '📌', color: 'bg-slate-100 border-slate-300', text: 'text-slate-600' };
}

export default function AdminDisputeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolveAction, setResolveAction] = useState(''); // REFUND | RELEASE
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/disputes/${id}`, { headers: adminHeaders() });
      setData(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleResolve = async () => {
    setResolveLoading(true);
    try {
      await axios.post(`${API}/api/admin/disputes/${id}/resolve`,
        { action: resolveAction, notes: resolveNotes },
        { headers: adminHeaders() }
      );
      showToast(resolveAction === 'REFUND' ? '↩️ Buyer refunded successfully' : '✅ Payment released to seller');
      setShowConfirm(false);
      setResolveAction('');
      setResolveNotes('');
      fetchDetail();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to resolve dispute', 'error');
    } finally {
      setResolveLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-slate-600 font-semibold">Dispute not found</p>
        <button onClick={() => navigate('/admin/dashboard')} className="mt-4 text-indigo-600 font-medium text-sm">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );

  const { dispute, order, buyer, seller, autoFlag, riskScore, riskReason, timeline } = data;
  const isResolved = dispute.status === 'RESOLVED';
  const price = parseFloat(order?.scopeBox?.price || 0);

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-inter pt-[64px]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Breadcrumb + header */}
        <div>
          <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-1 text-indigo-600 text-sm font-medium hover:underline mb-4">
            ← Back to Dashboard
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-slate-800">Dispute Details</h1>
                {autoFlag === 'AUTO_FLAGGED' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                    ⚑ AUTO-FLAGGED
                  </span>
                )}
                <StatusBadge status={dispute.status} />
              </div>
              <p className="text-slate-400 text-sm mt-1 font-mono">#{dispute.id}</p>
            </div>
            {/* Risk Score */}
            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${riskScore >= 75 ? 'bg-red-50 border-red-200' : riskScore >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Score</p>
                <p className={`text-3xl font-black ${riskScore >= 75 ? 'text-red-600' : riskScore >= 50 ? 'text-amber-600' : 'text-slate-600'}`}>{riskScore}</p>
              </div>
              <div className="text-right">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${riskScore >= 75 ? 'bg-red-100' : riskScore >= 50 ? 'bg-amber-100' : 'bg-slate-100'}`}>
                  {riskScore >= 75 ? '🔴' : riskScore >= 50 ? '🟡' : '🟢'}
                </div>
              </div>
            </div>
          </div>
          {riskReason && (
            <div className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${autoFlag === 'AUTO_FLAGGED' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-600'}`}>
              <span>{autoFlag === 'AUTO_FLAGGED' ? '⚠️' : 'ℹ️'}</span> {riskReason}
            </div>
          )}
        </div>

        {/* Main 2-col grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left: Order + Parties info */}
          <div className="lg:col-span-1 space-y-4">

            {/* Order Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
                <span>📦</span> Order Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Title</p>
                  <p className="font-semibold text-slate-800">{order?.scopeBox?.title || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-0.5">Amount</p>
                    <p className="text-lg font-black text-slate-800">${price.toFixed(2)}</p>
                    <p className="text-xs text-slate-400">{order?.currency || 'USD'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-0.5">Order Status</p>
                    <StatusBadge status={order?.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Service Type</p>
                  <p className="text-slate-700">{order?.scopeBox?.productType || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Platform</p>
                  <p className="text-slate-700">{order?.scopeBox?.platform || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Deadline</p>
                  <p className="text-slate-700">{fmtShort(order?.scopeBox?.deadline)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Order Created</p>
                  <p className="text-slate-700">{fmtShort(order?.createdAt)}</p>
                </div>
                {order?.id && (
                  <p className="text-xs font-mono text-slate-400 bg-slate-50 rounded-lg px-3 py-2 break-all">
                    #{order.id}
                  </p>
                )}
              </div>
            </div>

            {/* Buyer */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
                <span>👤</span> Buyer
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {(buyer?.firstName || order?.buyerName || 'B')?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {buyer ? `${buyer.firstName} ${buyer.lastName}` : order?.buyerName || '—'}
                  </p>
                  <p className="text-xs text-slate-400">{buyer?.email || order?.buyerEmail || '—'}</p>
                </div>
              </div>
              <p className="text-xs font-mono text-slate-400 bg-slate-50 rounded-lg px-3 py-2 break-all">
                #{dispute.buyerId}
              </p>
            </div>

            {/* Seller */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
                <span>🏪</span> Seller
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                  {(seller?.firstName || 'S')?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {seller ? `${seller.firstName} ${seller.lastName}` : '—'}
                  </p>
                  <p className="text-xs text-slate-400">{seller?.email || order?.sellerContact || '—'}</p>
                  {seller?.businessName && <p className="text-xs text-slate-500 mt-0.5">{seller.businessName}</p>}
                </div>
              </div>
              <p className="text-xs font-mono text-slate-400 bg-slate-50 rounded-lg px-3 py-2 break-all">
                #{dispute.sellerId}
              </p>
            </div>
          </div>

          {/* Right: Dispute info + Timeline + Decision */}
          <div className="lg:col-span-2 space-y-5">

            {/* Dispute Info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
                <span>⚖️</span> Dispute Information
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Reason</p>
                  <p className="font-semibold text-slate-800">{dispute.reason}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Raised By</p>
                  <p className="font-semibold text-slate-800 capitalize">{dispute.raisedBy}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Priority</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                    dispute.priority === 'HIGH' || dispute.priority === 'URGENT'
                      ? 'bg-red-100 text-red-700'
                      : dispute.priority === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {dispute.priority}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Filed On</p>
                  <p className="font-semibold text-slate-800">{fmtShort(dispute.createdAt)}</p>
                </div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <p className="text-xs text-slate-400 mb-1">Description</p>
                <p className="text-slate-700 text-sm leading-relaxed">{dispute.description}</p>
              </div>
              {dispute.requestedResolution && (
                <div className="mt-3 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <p className="text-xs text-slate-400 mb-1">Buyer's Requested Resolution</p>
                  <p className="text-slate-700 text-sm">{dispute.requestedResolution}</p>
                </div>
              )}
              {isResolved && (
                <div className="mt-3 bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-600 mb-2">✅ RESOLVED</p>
                  <p className="text-sm text-slate-700"><strong>Resolution:</strong> {dispute.resolution?.replace(/_/g, ' ')}</p>
                  {dispute.resolutionNotes && <p className="text-sm text-slate-600 mt-1">{dispute.resolutionNotes}</p>}
                  <p className="text-xs text-slate-400 mt-2">Resolved on {fmtShort(dispute.resolvedAt)}</p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-700 text-sm mb-5 flex items-center gap-2">
                <span>📅</span> Event Timeline
              </h3>
              {timeline?.length > 0 ? (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100" />
                  <div className="space-y-4">
                    {timeline.map((event, idx) => {
                      const meta = timelineIcon(event.event);
                      return (
                        <div key={idx} className="flex gap-4 relative">
                          {/* Icon bubble */}
                          <div className={`relative z-10 w-10 h-10 rounded-full ${meta.color} border-2 flex items-center justify-center flex-shrink-0 text-sm`}>
                            {meta.icon}
                          </div>
                          {/* Content */}
                          <div className="flex-1 pb-2">
                            <div className="flex items-center justify-between flex-wrap gap-1 mb-0.5">
                              <p className={`text-xs font-bold uppercase tracking-wide ${meta.text}`}>
                                {event.event?.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs text-slate-400">{fmtDate(event.timestamp)}</p>
                            </div>
                            {event.description && event.description !== event.event?.replace(/_/g, ' ') && (
                              <p className="text-sm text-slate-600">{event.description}</p>
                            )}
                            {event.notes && (
                              <p className="text-xs text-slate-400 mt-1 italic">"{event.notes}"</p>
                            )}
                            {event.by && (
                              <p className="text-xs text-slate-400 mt-1 capitalize">by {event.by}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-8">No timeline events yet</p>
              )}
            </div>

            {/* ── DECISION PANEL ── */}
            {!isResolved ? (
              <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">⚖️</span>
                  <h3 className="font-black text-slate-800 text-base">Admin Decision Panel</h3>
                </div>
                <p className="text-slate-500 text-sm mb-6">Review all evidence and choose a resolution action.</p>

                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  {/* Refund Buyer */}
                  <button
                    onClick={() => { setResolveAction('REFUND'); setShowConfirm(true); }}
                    className="group flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all duration-200 hover:shadow-md hover:shadow-red-100"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-red-100 group-hover:bg-red-200 flex items-center justify-center text-3xl transition-colors">
                      ↩️
                    </div>
                    <div className="text-center">
                      <p className="font-black text-red-700 text-sm">Refund Buyer</p>
                      <p className="text-xs text-red-400 mt-0.5">Return ${price.toFixed(2)} to buyer</p>
                    </div>
                  </button>

                  {/* Release to Seller */}
                  <button
                    onClick={() => { setResolveAction('RELEASE'); setShowConfirm(true); }}
                    className="group flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 transition-all duration-200 hover:shadow-md hover:shadow-emerald-100"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center text-3xl transition-colors">
                      ✅
                    </div>
                    <div className="text-center">
                      <p className="font-black text-emerald-700 text-sm">Release to Seller</p>
                      <p className="text-xs text-emerald-400 mt-0.5">Send ${price.toFixed(2)} to seller</p>
                    </div>
                  </button>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-700">
                  <strong>⚠️ Note:</strong> This action is irreversible. Please review the complete timeline and both parties' information before proceeding.
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 text-center">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-black text-emerald-700 text-lg">Dispute Resolved</h3>
                <p className="text-emerald-600 text-sm mt-1">{dispute.resolution?.replace(/_/g, ' ')}</p>
                {dispute.resolvedAt && <p className="text-xs text-emerald-400 mt-2">Resolved on {fmtShort(dispute.resolvedAt)}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">Confirm Resolution</h3>
              <button onClick={() => setShowConfirm(false)} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className={`text-center py-4 rounded-2xl ${resolveAction === 'REFUND' ? 'bg-red-50' : 'bg-emerald-50'}`}>
                <div className="text-4xl mb-2">{resolveAction === 'REFUND' ? '↩️' : '✅'}</div>
                <p className={`font-black text-lg ${resolveAction === 'REFUND' ? 'text-red-700' : 'text-emerald-700'}`}>
                  {resolveAction === 'REFUND' ? 'Refund Buyer' : 'Release to Seller'}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {resolveAction === 'REFUND'
                    ? `$${price.toFixed(2)} will be returned to the buyer`
                    : `$${price.toFixed(2)} will be released to the seller`}
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Resolution Notes (optional)</label>
                <textarea
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes about your decision..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={handleResolve}
                disabled={resolveLoading}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all disabled:opacity-50 ${resolveAction === 'REFUND' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
              >
                {resolveLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : resolveAction === 'REFUND' ? '↩️ Confirm Refund' : '✅ Confirm Release'}
              </button>
              <button onClick={() => setShowConfirm(false)} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
