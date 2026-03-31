import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EnhancedDisputeResolution from '../components/EnhancedDisputeResolution';

const API = import.meta.env.VITE_API_URL || '';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEV_COLORS = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  HIGH:     'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW:      'bg-blue-100 text-blue-700 border-blue-200',
};
const SEV_ICONS = { CRITICAL: '🚨', HIGH: '⚠️', MEDIUM: '⚡', LOW: 'ℹ️' };

const REC_CFG = {
  REFUND_BUYER:       { color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     icon: '💸', label: 'Refund Buyer' },
  RELEASE_TO_SELLER:  { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✅', label: 'Release to Seller' },
  PARTIAL_REFUND:     { color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: '⚖️', label: 'Partial Refund' },
  ESCALATE_TO_HUMAN:  { color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  icon: '👤', label: 'Escalate to Human' },
  ESCALATE:           { color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  icon: '👤', label: 'Needs Human Review' },
};

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
}
function fmtTime(d) {
  return d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
}

function RiskGauge({ score }) {
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f97316' : '#22c55e';
  const pct = Math.min(score, 100);
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#f3f4f6" strokeWidth="12" />
          <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={`${2.39 * pct} ${239 - 2.39 * pct}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black font-inter" style={{ color }}>{score}</span>
          <span className="text-[10px] text-neutral-400 font-inter">/100</span>
        </div>
      </div>
      <span className="text-xs font-bold font-inter mt-1" style={{ color }}>
        {score >= 70 ? 'High Risk' : score >= 40 ? 'Medium Risk' : 'Low Risk'}
      </span>
    </div>
  );
}

function ConfBar({ value, color = 'bg-indigo-500', label }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      {label && <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider font-inter mb-1">{label}</p>}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-neutral-100 rounded-full h-2.5 overflow-hidden">
          <div className={`${color} h-full rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm font-bold font-inter text-neutral-700 w-9 text-right">{pct}%</span>
      </div>
    </div>
  );
}

function TimelineEntry({ entry, isLast }) {
  const eventColors = {
    DISPUTE_CREATED:  'bg-red-500',
    RULE_ENGINE_RAN:  'bg-orange-500',
    AI_ANALYSIS_COMPLETE: 'bg-violet-500',
    AI_REANALYZED:    'bg-violet-400',
    EVIDENCE_SUBMITTED: 'bg-indigo-500',
    EVIDENCE_ADDED:   'bg-indigo-400',
    SMART_ESCALATED:  'bg-blue-500',
    STATUS_UPDATED:   'bg-neutral-400',
    DISPUTE_RESOLVED: 'bg-emerald-500',
    default:          'bg-neutral-300',
  };
  const dotColor = eventColors[entry.event] || eventColors.default;

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${dotColor}`} />
        {!isLast && <div className="w-0.5 bg-neutral-150 flex-1 mt-1" style={{ background: '#e5e7eb' }} />}
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-neutral-800 font-inter leading-snug">{entry.description}</p>
          <span className="text-[10px] text-neutral-400 font-inter flex-shrink-0 mt-0.5">{fmtTime(entry.timestamp)}</span>
        </div>
        {entry.notes && (
          <p className="text-xs text-neutral-500 font-inter mt-0.5 italic leading-relaxed">{entry.notes}</p>
        )}
        <p className="text-[10px] text-neutral-300 font-inter mt-1 uppercase tracking-wide">{entry.by}</p>
      </div>
    </div>
  );
}

// ─── Main Admin Dispute Details ────────────────────────────────────────────────

export default function AdminDisputeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Resolution form
  const [resolution, setResolution] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);

  // AI refresh
  const [refreshingAI, setRefreshingAI] = useState(false);

  // Enhanced resolution modal
  const [showEnhancedResolution, setShowEnhancedResolution] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/disputes/${id}/full`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setData(res.data.data);
        if (res.data.data.dispute.status === 'RESOLVED') setResolved(true);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load dispute');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  // Poll for AI if not ready
  useEffect(() => {
    if (!data?.dispute?.aiAnalysis && !loading) {
      const interval = setInterval(fetchDetail, 5000);
      return () => clearInterval(interval);
    }
  }, [data?.dispute?.aiAnalysis, loading, fetchDetail]);

  const handleRefreshAI = async () => {
    setRefreshingAI(true);
    try {
      await axios.post(`${API}/api/disputes/${id}/ai-analysis`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchDetail();
    } catch (e) {
      alert('Failed to refresh AI analysis');
    } finally {
      setRefreshingAI(false);
    }
  };

  const handleResolve = async () => {
    if (!resolution) return alert('Please select a resolution');
    setResolving(true);
    try {
      // admin.js expects action: "REFUND" | "RELEASE"
      const action = resolution === 'REFUND_BUYER' ? 'REFUND' : 'RELEASE';
      await axios.post(
        `${API}/api/admin/disputes/${id}/resolve`,
        { action, notes: resolutionNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResolved(true);
      await fetchDetail();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  const handleEnhancedResolve = async (disputeId, resolutionData) => {
    try {
      // Map enhanced resolution to backend format
      const actionMap = {
        'REFUND_BUYER_FULL': 'REFUND',
        'RELEASE_TO_SELLER': 'RELEASE',
        'PARTIAL_REFUND_75_25': 'REFUND',
        'PARTIAL_REFUND_50_50': 'REFUND',
        'CONTINUE_WITH_EXTENSION': 'RELEASE',
        'CANCEL_AND_REFUND': 'REFUND'
      };

      const action = actionMap[resolutionData.resolution] || 'REFUND';
      
      await axios.post(
        `${API}/api/admin/disputes/${disputeId}/resolve`,
        { 
          action, 
          notes: resolutionData.resolutionNotes,
          enhancedAnalysis: resolutionData.evidenceAnalysis,
          scopeCompliance: resolutionData.scopeCompliance
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResolved(true);
      setShowEnhancedResolution(false);
      await fetchDetail();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to resolve dispute');
      throw e;
    }
  };

  // ─── Loading / Error ──────────────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-neutral-400 font-inter">Loading dispute intelligence…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-inter mb-4">{error}</p>
          <button onClick={() => navigate('/admin/dashboard')}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-inter font-semibold">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { dispute, order, buyer, seller, financial, ruleFlags: rf, aiAnalysis: ai, evidenceResponses, chatMessages } = data || {};
  const recCfg = REC_CFG[ai?.recommendation || rf?.autoRecommendation] || REC_CFG.ESCALATE;

  return (
    <div className="min-h-screen bg-[#F6F9FC] py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-[#0A2540] font-inter font-medium transition-colors group">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Admin Dashboard
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border uppercase tracking-wider font-inter ${
              dispute?.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              dispute?.status === 'MEDIATION' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
              'bg-red-50 text-red-700 border-red-200'
            }`}>{dispute?.status}</span>
          </div>
        </div>

        {/* ── HEADER ───────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">⚖️</span>
                </div>
                <div>
                  <h1 className="text-xl font-black font-inter">Dispute Intelligence Report</h1>
                  <p className="text-xs text-white/50 font-inter font-mono mt-0.5">{dispute?.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {[
                  { label: 'Escrow Amount', value: `$${financial?.escrowAmount?.toFixed(2) || '0.00'}`, icon: '💰' },
                  { label: 'Platform Fee (5%)', value: `$${financial?.platformFee?.toFixed(2) || '0.00'}`, icon: '🏛️' },
                  { label: 'Raised By', value: dispute?.raisedBy?.charAt(0).toUpperCase() + dispute?.raisedBy?.slice(1), icon: '👤' },
                  { label: 'Filed', value: fmt(dispute?.createdAt), icon: '📅' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <p className="text-[10px] text-white/40 font-inter uppercase tracking-wider mb-0.5">{item.icon} {item.label}</p>
                    <p className="text-sm font-bold text-white font-inter">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            {rf?.riskScore !== undefined && <RiskGauge score={rf.riskScore} />}
          </div>
        </div>

        {/* ── MAIN GRID ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT COL ───────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Order snapshot */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider font-inter mb-4">Order Snapshot</h2>
              <div className="space-y-3">
                {[
                  { label: 'Service', value: order?.scopeBox?.productType || 'Content Writing' },
                  { label: 'Blog Topic', value: order?.scopeBox?.contentWritingSpecific?.topic || order?.scopeBox?.topic || '—' },
                  { label: 'Min. Word Count', value: rf?.minWordCount ? `${rf.minWordCount.toLocaleString()} words` : '—' },
                  { label: 'Words Delivered', value: rf?.analyzedWordCount > 0 ? `${rf.analyzedWordCount.toLocaleString()} words` : 'Unknown (non-txt file)' },
                  { label: 'Deadline', value: fmt(order?.scopeBox?.deadline) },
                  { label: 'Delivery Files', value: `${order?.deliveryFiles?.length || 0} file(s)` },
                  { label: 'Buyer', value: buyer ? `${buyer.firstName} ${buyer.lastName} (${buyer.email})` : order?.buyerName || '—' },
                  { label: 'Seller', value: seller ? `${seller.firstName} ${seller.lastName}` : order?.sellerContact || '—' },
                ].map((row, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-neutral-50 last:border-0">
                    <p className="text-xs font-semibold text-neutral-400 font-inter w-32 flex-shrink-0">{row.label}</p>
                    <p className="text-sm text-neutral-800 font-inter font-medium">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispute details */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider font-inter mb-4">Dispute Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-neutral-400 font-inter mb-1">Reason</p>
                  <span className="inline-block px-3 py-1.5 bg-red-50 text-red-700 text-sm font-semibold rounded-lg border border-red-100 font-inter">
                    {dispute?.reason}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-400 font-inter mb-1">Buyer's Complaint</p>
                  <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                    <p className="text-sm text-neutral-700 font-inter leading-relaxed">{dispute?.description}</p>
                  </div>
                </div>
                {dispute?.requestedResolution && (
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 font-inter mb-1">Requested Resolution</p>
                    <p className="text-sm text-neutral-700 font-inter">{dispute.requestedResolution}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rule Engine Flags */}
            {rf?.flags?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#0A2540] font-inter">Rule Engine Flags</h2>
                    <p className="text-xs text-neutral-400 font-inter">{rf.flags.length} automated flag{rf.flags.length !== 1 ? 's' : ''} triggered</p>
                  </div>
                  <div className="ml-auto flex gap-4 text-xs font-inter font-semibold">
                    <span className="text-orange-600">Seller fault: <strong>{rf.sellerFaultPoints}pts</strong></span>
                    <span className="text-blue-600">Buyer fault: <strong>{rf.buyerFaultPoints}pts</strong></span>
                  </div>
                </div>
                <div className="space-y-2">
                  {rf.flags.map((flag, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${SEV_COLORS[flag.severity] || 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}>
                      <span>{SEV_ICONS[flag.severity] || 'ℹ️'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold font-inter">{flag.label}</p>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border font-inter">{flag.severity}</span>
                          <span className="text-[10px] text-neutral-400 font-inter ml-auto">+{flag.riskPoints}pts · fault: {flag.fault}</span>
                        </div>
                        <p className="text-xs font-inter leading-relaxed mt-0.5 opacity-80">{flag.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis Panel */}
            <div className={`bg-white rounded-2xl shadow-sm border ${ai ? 'border-violet-100' : 'border-dashed border-violet-200'} p-6`}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#0A2540] font-inter">Grok AI Analysis</h2>
                    <p className="text-xs text-neutral-400 font-inter">
                      {ai
                        ? `Source: ${
                            ai.source === 'rule_engine_fallback'
                              ? 'Rule Engine Fallback'
                              : ai.source === 'grok'
                                ? 'xAI Grok'
                                : ai.source === 'gemini'
                                  ? 'Google Gemini (legacy)'
                                  : 'AI'
                          }`
                        : 'Analysis in progress...'}
                    </p>
                  </div>
                </div>
                <button onClick={handleRefreshAI} disabled={refreshingAI}
                  className="text-xs text-violet-600 font-semibold font-inter hover:text-violet-800 disabled:opacity-50 flex items-center gap-1">
                  <svg className={`w-3 h-3 ${refreshingAI ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {refreshingAI ? 'Refreshing…' : 'Re-analyze'}
                </button>
              </div>

              {!ai ? (
                <div className="flex items-center gap-3 py-4">
                  <svg className="animate-spin w-5 h-5 text-violet-400 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm text-neutral-500 font-inter">AI is analyzing all evidence, chat logs, and order data…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Recommendation */}
                  <div className={`flex items-center gap-4 p-4 rounded-xl border ${recCfg.bg} ${recCfg.border}`}>
                    <span className="text-3xl">{recCfg.icon}</span>
                    <div className="flex-1">
                      <p className="text-[10px] text-neutral-500 font-inter font-bold uppercase tracking-wider">AI Recommends</p>
                      <p className={`text-xl font-black font-inter ${recCfg.color}`}>{recCfg.label}</p>
                      <p className="text-xs text-neutral-500 font-inter italic mt-0.5">{ai.summary}</p>
                    </div>
                  </div>

                  {/* Confidence */}
                  <ConfBar value={ai.confidence} color="bg-violet-500" label="Confidence Level" />

                  {/* Reasoning */}
                  <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-inter mb-2">AI Reasoning</p>
                    <p className="text-sm text-neutral-700 font-inter leading-relaxed">{ai.reasoning}</p>
                  </div>

                  {/* Key Findings */}
                  {ai.keyFindings?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-inter mb-2">Key Findings</p>
                      <ul className="space-y-1.5">
                        {ai.keyFindings.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm font-inter text-neutral-700">
                            <span className="text-violet-400 mt-0.5 flex-shrink-0">›</span>{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Fault probability bars */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 space-y-2">
                      <ConfBar value={ai.sellerFaultProbability || 0} color="bg-orange-500" label="Seller Fault Probability" />
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-2">
                      <ConfBar value={ai.buyerFaultProbability || 0} color="bg-blue-500" label="Buyer Fault Probability" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                      <p className="text-[10px] text-neutral-400 font-inter font-semibold uppercase tracking-wider mb-1">Fraud Probability</p>
                      <p className={`text-lg font-black font-inter ${ai.fraudProbability > 0.5 ? 'text-red-600' : ai.fraudProbability > 0.25 ? 'text-orange-500' : 'text-emerald-600'}`}>
                        {Math.round((ai.fraudProbability || 0) * 100)}%
                      </p>
                    </div>
                    <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                      <p className="text-[10px] text-neutral-400 font-inter font-semibold uppercase tracking-wider mb-1">Behavioral Score</p>
                      <p className={`text-lg font-black font-inter ${ai.behavioralScore >= 70 ? 'text-emerald-600' : ai.behavioralScore >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                        {ai.behavioralScore}/100
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Evidence Responses */}
            {(evidenceResponses?.seller?.text || evidenceResponses?.buyer?.text) && (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
                <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider font-inter mb-4">Submitted Evidence</h2>
                <div className="space-y-3">
                  {evidenceResponses.seller?.text && (
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                      <p className="text-xs font-bold text-orange-600 font-inter mb-2 flex items-center gap-2">
                        🔷 Seller's Counter-Evidence
                        <span className="font-normal text-orange-400">{fmtTime(evidenceResponses.seller.submittedAt)}</span>
                      </p>
                      <p className="text-sm text-neutral-700 font-inter leading-relaxed">{evidenceResponses.seller.text}</p>
                    </div>
                  )}
                  {evidenceResponses.buyer?.text && (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <p className="text-xs font-bold text-blue-600 font-inter mb-2 flex items-center gap-2">
                        🔶 Buyer's Statement
                        <span className="font-normal text-blue-400">{fmtTime(evidenceResponses.buyer.submittedAt)}</span>
                      </p>
                      <p className="text-sm text-neutral-700 font-inter leading-relaxed">{evidenceResponses.buyer.text}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chat Log Preview */}
            {chatMessages?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
                <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider font-inter mb-4">
                  Recent Chat Log ({chatMessages.length} messages)
                </h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {chatMessages.slice(-10).map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.senderRole === 'buyer' ? 'flex-row-reverse' : ''}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-xl text-sm font-inter ${
                        msg.senderRole === 'buyer'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-neutral-100 text-neutral-800'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.senderRole === 'buyer' ? 'text-indigo-200' : 'text-neutral-400'}`}>
                          {msg.senderName} · {fmtTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {dispute?.timeline?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
                <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider font-inter mb-4">Dispute Timeline</h2>
                <div>
                  {dispute.timeline.map((entry, i) => (
                    <TimelineEntry key={i} entry={entry} isLast={i === dispute.timeline.length - 1} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COL ──────────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Financial Analysis */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sticky top-20">
              <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider font-inter mb-4">💰 Financial Analysis</h2>

              <div className="space-y-2 mb-4">
                {[
                  { label: 'Escrow Held', value: `$${financial?.escrowAmount?.toFixed(2) || '0'}`, color: 'text-[#0A2540]', bold: true },
                  { label: 'Platform Fee (5%)', value: `-$${financial?.platformFee?.toFixed(2) || '0'}`, color: 'text-neutral-500' },
                  { label: 'Net to Seller', value: `$${financial?.netToSeller?.toFixed(2) || '0'}`, color: 'text-emerald-600' },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between items-center py-2 ${i === 0 ? 'border-b border-neutral-100' : ''}`}>
                    <p className="text-xs text-neutral-500 font-inter">{row.label}</p>
                    <p className={`text-sm font-inter font-bold ${row.color}`}>{row.value}</p>
                  </div>
                ))}
              </div>

              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-inter mb-3">Resolution Scenarios</p>

              <div className="space-y-2">
                {/* Refund scenario */}
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <span className="text-base">💸</span>
                  <div className="flex-1 text-xs font-inter">
                    <p className="font-bold text-red-700 mb-1">Full Refund to Buyer</p>
                    <p className="text-neutral-500">Buyer gets: <strong className="text-red-600">${financial?.refundScenario?.buyerReceives?.toFixed(2) || '0'}</strong></p>
                    <p className="text-neutral-500">Seller gets: <strong>$0</strong></p>
                    <p className="text-neutral-500">Platform: <strong>$0</strong></p>
                  </div>
                </div>

                {/* Release scenario */}
                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-base">✅</span>
                  <div className="flex-1 text-xs font-inter">
                    <p className="font-bold text-emerald-700 mb-1">Release to Seller</p>
                    <p className="text-neutral-500">Buyer gets: <strong>$0</strong></p>
                    <p className="text-neutral-500">Seller gets: <strong className="text-emerald-600">${financial?.releaseScenario?.sellerReceives?.toFixed(2) || '0'}</strong></p>
                    <p className="text-neutral-500">Platform: <strong>${financial?.releaseScenario?.platformReceives?.toFixed(2) || '0'}</strong></p>
                  </div>
                </div>

                {/* Partial scenarios */}
                {financial?.partialScenarios?.slice(0, 2).map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="text-base">⚖️</span>
                    <div className="flex-1 text-xs font-inter">
                      <p className="font-bold text-amber-700 mb-1">{s.label}</p>
                      <p className="text-neutral-500">Buyer: <strong className="text-amber-600">${s.buyerReceives?.toFixed(2)}</strong> · Seller: <strong>${s.sellerReceives?.toFixed(2)}</strong></p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Admin Decision */}
              {!resolved && (
                <div className="mt-6 space-y-3">
                  <p className="text-xs font-bold text-neutral-700 font-inter uppercase tracking-wider">Make Final Decision</p>

                  {/* Enhanced Resolution Button */}
                  <button
                    onClick={() => setShowEnhancedResolution(true)}
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700
                      text-white font-inter font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span className="text-lg">🧠</span>
                    Enhanced Resolution with AI Analysis
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-neutral-400 font-inter">or use simple resolution</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { val: 'REFUND_BUYER', label: '💸 Refund Buyer', cls: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' },
                      { val: 'RELEASE_TO_SELLER', label: '✅ Release to Seller', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => setResolution(prev => prev === opt.val ? '' : opt.val)}
                        className={`w-full py-2.5 rounded-xl border text-sm font-bold font-inter transition-all flex items-center justify-between px-3
                          ${resolution === opt.val ? opt.cls + ' ring-2 ring-offset-1 ring-current' : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'}`}
                      >
                        <span>{opt.label}</span>
                        {resolution === opt.val && <span>✓</span>}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={resolutionNotes}
                    onChange={e => setResolutionNotes(e.target.value)}
                    placeholder="Admin notes (optional)…"
                    rows={3}
                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm font-inter focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  />

                  <button
                    onClick={handleResolve}
                    disabled={!resolution || resolving}
                    className="w-full py-3 bg-[#0A2540] hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed
                      text-white font-inter font-black rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {resolving ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path d="M4 12a8 8 0 018-8" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Processing…
                      </>
                    ) : '🏁 Confirm Final Decision'}
                  </button>
                </div>
              )}

              {resolved && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                  <p className="text-sm font-bold text-emerald-700 font-inter">✅ Dispute Resolved</p>
                  <p className="text-xs text-emerald-600 font-inter mt-1">
                    {dispute?.resolution?.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Resolution Modal */}
      {showEnhancedResolution && data && (
        <EnhancedDisputeResolution
          dispute={data.dispute}
          order={data.order}
          buyer={data.buyer}
          seller={data.seller}
          onClose={() => setShowEnhancedResolution(false)}
          onResolve={handleEnhancedResolve}
        />
      )}
    </div>
  );
}
