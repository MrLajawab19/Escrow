import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ─── Utilities ────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL || '';

const SEV_CONFIG = {
  CRITICAL: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700 border-red-200', icon: '🚨', label: 'Critical' },
  HIGH:     { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700 border-orange-200', icon: '⚠️', label: 'High' },
  MEDIUM:   { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '⚡', label: 'Medium' },
  LOW:      { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700 border-blue-200', icon: 'ℹ️', label: 'Low' },
};

const REC_CONFIG = {
  REFUND_BUYER:       { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: '💸', label: 'Refund Buyer' },
  RELEASE_TO_SELLER:  { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✅', label: 'Release to Seller' },
  PARTIAL_REFUND:     { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: '⚖️', label: 'Partial Refund' },
  ESCALATE_TO_HUMAN:  { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: '👤', label: 'Escalate to Human' },
  ESCALATE:           { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: '👤', label: 'Needs Human Review' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskGauge({ score }) {
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f97316' : '#22c55e';
  const pct = Math.min(score, 100);
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${2.51 * pct} ${251 - 2.51 * pct}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black font-inter" style={{ color }}>{score}</span>
          <span className="text-[10px] text-neutral-400 font-inter -mt-0.5">/ 100</span>
        </div>
      </div>
      <p className="text-xs font-semibold font-inter mt-1" style={{ color }}>
        {score >= 70 ? 'High Risk' : score >= 40 ? 'Medium Risk' : 'Low Risk'}
      </p>
    </div>
  );
}

function ConfidenceBar({ confidence }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-neutral-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-1000`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold font-inter text-neutral-700 w-10 text-right">{pct}%</span>
    </div>
  );
}

function FlagCard({ flag }) {
  const sev = SEV_CONFIG[flag.severity] || SEV_CONFIG.LOW;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${sev.bg} ${sev.border}`}>
      <span className="text-lg flex-shrink-0">{sev.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-sm font-bold text-neutral-800 font-inter">{flag.label}</p>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border font-inter ${sev.badge}`}>
            {sev.label}
          </span>
          <span className="text-[10px] font-semibold text-neutral-400 font-inter ml-auto">
            +{flag.riskPoints} pts
          </span>
        </div>
        <p className="text-xs text-neutral-600 font-inter leading-relaxed">{flag.description}</p>
        <p className="text-[10px] text-neutral-400 font-inter mt-1">
          Fault: <span className="font-semibold capitalize">{flag.fault}</span>
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * DisputeResolutionFlow
 * Shows inside OrderDetails when order.status === 'DISPUTED'
 *
 * Props:
 *  - orderId: string
 *  - order: Order object
 *  - userType: 'buyer' | 'seller'
 *  - token: JWT string
 *  - onOrderUpdate: function
 */
const DisputeResolutionFlow = ({ orderId, order, userType, token, onOrderUpdate }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Evidence submission state
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Escalation state
  const [escalating, setEscalating] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalated, setEscalated] = useState(false);

  // AI polling
  const [aiPolling, setAiPolling] = useState(false);

  // Scope box details toggle
  const [showScopeBoxDetails, setShowScopeBoxDetails] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/disputes/${order.disputeId}/full`, { headers });
      if (res.data.success) {
        setDetail(res.data.data);
        if (res.data.data.dispute.status === 'MEDIATION') setEscalated(true);
        if (res.data.data.dispute.evidenceResponses?.[userType]?.submittedAt) setSubmitted(true);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load dispute details');
    } finally {
      setLoading(false);
    }
  }, [order.disputeId, token]);

  useEffect(() => {
    if (order?.disputeId) fetchDetail();
  }, [order?.disputeId, fetchDetail]);

  // Poll for AI analysis if not yet available
  useEffect(() => {
    if (!detail?.dispute?.aiAnalysis && !loading) {
      const interval = setInterval(() => {
        fetchDetail();
      }, 4000);
      setAiPolling(true);
      return () => { clearInterval(interval); setAiPolling(false); };
    } else {
      setAiPolling(false);
    }
  }, [detail?.dispute?.aiAnalysis, loading]);

  const handleEvidenceSubmit = async (e) => {
    e.preventDefault();
    if (!evidenceText.trim() && evidenceFiles.length === 0) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('text', evidenceText);
      evidenceFiles.forEach(f => formData.append('files', f));

      await axios.post(
        `${API}/api/disputes/${detail.dispute.id}/submit-evidence`,
        formData,
        { headers: { ...headers, 'Content-Type': 'multipart/form-data' } }
      );
      setSubmitted(true);
      await fetchDetail();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to submit evidence');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSmartEscalate = async () => {
    setEscalating(true);
    try {
      await axios.post(
        `${API}/api/disputes/${detail.dispute.id}/smart-escalate`,
        { reason: escalateReason || 'Not satisfied with the AI recommendation' },
        { headers }
      );
      setEscalated(true);
      setShowEscalateModal(false);
      await fetchDetail();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to escalate');
    } finally {
      setEscalating(false);
    }
  };

  const handleRefreshAI = async () => {
    try {
      await axios.post(`${API}/api/disputes/${detail.dispute.id}/ai-analysis`, {}, { headers });
      await fetchDetail();
    } catch (e) {
      alert('Failed to refresh AI analysis');
    }
  };

  // ─── Loading / Error states ─────────────────────────────────────────────────

  if (loading && !detail) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
            <span className="text-lg">⚖️</span>
          </div>
          <h2 className="text-base font-bold text-[#0A2540] font-inter">Dispute Resolution Center</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-neutral-100 rounded-xl h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 text-center">
        <p className="text-red-500 font-inter text-sm">{error}</p>
        <button onClick={fetchDetail} className="mt-3 text-sm text-indigo-600 font-semibold font-inter hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (!detail) return null;

  const { dispute, financial, ruleFlags, aiAnalysis, evidenceResponses, buyer, seller } = detail;
  const rf = ruleFlags || {};
  const ai = aiAnalysis || null;
  const myRole = userType;
  const myEvidenceSubmitted = evidenceResponses?.[myRole]?.submittedAt;
  const iAmFlagged = rf.requiresEvidence?.includes(myRole);
  const recConfig = REC_CONFIG[ai?.recommendation || rf.autoRecommendation] || REC_CONFIG.ESCALATE;
  const disputeStatus = dispute.status;

  return (
    <div className="space-y-4">

      {/* ── DISPUTE HEADER ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-sm border border-red-100 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl">⚖️</span>
            </div>
            <div>
              <h2 className="text-base font-black text-[#0A2540] font-inter">Dispute Resolution Center</h2>
              <p className="text-xs text-neutral-500 font-inter mt-0.5">
                Status:&nbsp;
                <span className={`font-bold ${
                  disputeStatus === 'RESOLVED' ? 'text-emerald-600' :
                  disputeStatus === 'MEDIATION' ? 'text-indigo-600' :
                  'text-red-600'
                }`}>
                  {disputeStatus === 'OPEN' ? 'Under Investigation' :
                   disputeStatus === 'RESPONDED' ? 'Evidence Collected' :
                   disputeStatus === 'MEDIATION' ? 'Human Review Requested' :
                   disputeStatus === 'RESOLVED' ? 'Resolved' : disputeStatus}
                </span>
              </p>
            </div>
          </div>

          {/* Risk Score Gauge */}
          {rf.riskScore !== undefined && <RiskGauge score={rf.riskScore} />}
        </div>

        {/* Word Count Info */}
        {rf.minWordCount > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-white/70 rounded-xl p-3 border border-white">
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider font-inter">Min Word Count</p>
              <p className="text-lg font-black text-[#0A2540] font-inter">{rf.minWordCount.toLocaleString()}</p>
            </div>
            <div className={`rounded-xl p-3 border ${rf.analyzedWordCount < rf.minWordCount ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider font-inter">Words Delivered</p>
              <p className={`text-lg font-black font-inter ${rf.analyzedWordCount < rf.minWordCount ? 'text-red-600' : 'text-emerald-600'}`}>
                {rf.analyzedWordCount > 0 ? rf.analyzedWordCount.toLocaleString() : '—'}
              </p>
            </div>
            <div className="bg-white/70 rounded-xl p-3 border border-white">
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider font-inter">Gap</p>
              <p className={`text-lg font-black font-inter ${rf.wordCountDelta !== null && rf.wordCountDelta < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {rf.wordCountDelta !== null
                  ? (rf.wordCountDelta >= 0 ? `+${rf.wordCountDelta}` : rf.wordCountDelta)
                  : '—'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── AUTO-FLAGS ──────────────────────────────────────────────────────── */}
      {rf.flags && rf.flags.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A2540] font-inter">Auto-Detection Flags</h3>
              <p className="text-xs text-neutral-400 font-inter">{rf.flags.length} issue{rf.flags.length !== 1 ? 's' : ''} detected by rule engine</p>
            </div>
          </div>
          <div className="space-y-2">
            {rf.flags.map((flag, i) => <FlagCard key={i} flag={flag} />)}
          </div>
        </div>
      )}

      {rf.flags && rf.flags.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm font-bold text-emerald-700 font-inter">No violations detected by rule engine</p>
            <p className="text-xs text-neutral-400 font-inter">The AI will analyze the dispute details for further insights</p>
          </div>
        </div>
      )}

      {/* ── EVIDENCE SUBMISSION (for flagged party) ──────────────────────────── */}
      {iAmFlagged && !myEvidenceSubmitted && disputeStatus !== 'RESOLVED' && (
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A2540] font-inter">
                {myRole === 'seller' ? 'Your Response Required' : 'Clarification Required'}
              </h3>
              <p className="text-xs text-red-500 font-inter font-semibold">
                The system has flagged issues on your side. Please provide your counter-evidence.
              </p>
            </div>
          </div>

          <form onSubmit={handleEvidenceSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 font-inter mb-1.5">
                Your Statement *
              </label>
              <textarea
                value={evidenceText}
                onChange={e => setEvidenceText(e.target.value)}
                rows={4}
                placeholder={
                  myRole === 'seller'
                    ? 'Explain what you delivered, why the word count may differ, any delays, etc...'
                    : 'Explain exactly what issues you found with the delivered work...'
                }
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm font-inter focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 font-inter mb-1.5">
                Upload Supporting Files (optional)
              </label>
              <input
                type="file"
                multiple
                accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={e => setEvidenceFiles(Array.from(e.target.files))}
                className="block w-full text-sm text-neutral-500 font-inter
                  file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
                  file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100 transition-all cursor-pointer"
              />
              {evidenceFiles.length > 0 && (
                <p className="text-xs text-indigo-600 font-inter mt-1">
                  {evidenceFiles.length} file(s) selected
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || (!evidenceText.trim() && evidenceFiles.length === 0)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                text-white font-inter font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path d="M4 12a8 8 0 018-8" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Submitting...
                </>
              ) : '📤 Submit Counter-Evidence'}
            </button>
          </form>
        </div>
      )}

      {/* Evidence submitted confirmation */}
      {myEvidenceSubmitted && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="text-sm font-bold text-emerald-700 font-inter">Your evidence has been submitted</p>
            <p className="text-xs text-emerald-600 font-inter">The AI will factor in your response. Analysis is being updated.</p>
          </div>
        </div>
      )}

      {/* ── SCOPE BOX ANALYSIS ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <span className="text-emerald-600">📋</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A2540] font-inter">Scope Box Analysis</h3>
              <p className="text-xs text-neutral-400 font-inter">Original requirements vs delivery</p>
            </div>
          </div>
          <button
            onClick={() => setShowScopeBoxDetails(!showScopeBoxDetails)}
            className="text-xs text-emerald-600 font-semibold font-inter hover:text-emerald-800 flex items-center gap-1"
          >
            {showScopeBoxDetails ? 'Hide' : 'Show'} Details
            <svg className={`w-3 h-3 transform transition-transform ${showScopeBoxDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Scope Compliance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider font-inter mb-1">Requirements</p>
            <p className="text-lg font-black text-emerald-700 font-inter">
              {detail.order?.scopeBox?.deliverables?.length || 0}
            </p>
            <p className="text-xs text-emerald-600 font-inter">deliverables</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider font-inter mb-1">Deadline</p>
            <p className="text-lg font-black text-blue-700 font-inter">
              {detail.order?.scopeBox?.deadline ? 
                new Date(detail.order.scopeBox.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 
                'Not set'
              }
            </p>
            <p className="text-xs text-blue-600 font-inter">due date</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
            <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider font-inter mb-1">Value</p>
            <p className="text-lg font-black text-amber-700 font-inter">
              ${detail.order?.scopeBox?.price || '0'}
            </p>
            <p className="text-xs text-amber-600 font-inter">order value</p>
          </div>
        </div>

        {/* Detailed Scope Box */}
        {showScopeBoxDetails && detail.order?.scopeBox && (
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 space-y-4">
            <div>
              <p className="text-sm font-semibold text-emerald-900 mb-2">📝 Description</p>
              <p className="text-sm text-emerald-800 leading-relaxed bg-white rounded-lg p-3 border border-emerald-200">
                {detail.order.scopeBox.description || 'No description provided'}
              </p>
            </div>

            {detail.order.scopeBox.deliverables && (
              <div>
                <p className="text-sm font-semibold text-emerald-900 mb-2">✅ Deliverables Required</p>
                <ul className="space-y-1">
                  {detail.order.scopeBox.deliverables.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detail.order.scopeBox.deadline && (
                <div>
                  <p className="text-sm font-semibold text-emerald-900 mb-1">📅 Deadline</p>
                  <p className="text-sm text-emerald-800">
                    {new Date(detail.order.scopeBox.deadline).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-xs text-emerald-600">
                    {new Date(detail.order.scopeBox.deadline) < new Date() ? '⚠️ Overdue' : '⏱️ Pending'}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-emerald-900 mb-1">💰 Price</p>
                <p className="text-sm text-emerald-800 font-semibold">
                  ${detail.order.scopeBox.price?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-emerald-600">Escrow amount</p>
              </div>
            </div>

            {/* Additional Scope Box Fields */}
            {Object.keys(detail.order.scopeBox).filter(key => 
              !['description', 'deliverables', 'deadline', 'price'].includes(key)
            ).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-emerald-900 mb-2">🔧 Additional Requirements</p>
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  {Object.entries(detail.order.scopeBox)
                    .filter(([key]) => !['description', 'deliverables', 'deadline', 'price'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="mb-2 last:mb-0">
                        <p className="text-xs font-semibold text-emerald-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-sm text-emerald-800">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DISPUTE DETAILS ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
            <span className="text-red-600">⚠️</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0A2540] font-inter">Dispute Details</h3>
            <p className="text-xs text-neutral-400 font-inter">What went wrong</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider font-inter mb-1">Reason</p>
            <span className="inline-block px-3 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-lg border border-red-200 font-inter">
              {dispute.reason}
            </span>
          </div>
          
          <div>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider font-inter mb-1">Complaint Details</p>
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <p className="text-sm text-red-800 font-inter leading-relaxed">{dispute.description}</p>
            </div>
          </div>

          {dispute.requestedResolution && (
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider font-inter mb-1">Requested Resolution</p>
              <p className="text-sm text-red-800 font-inter">{dispute.requestedResolution}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-inter mb-1">Raised By</p>
              <p className="text-sm text-neutral-800 font-inter capitalize">{dispute.raisedBy}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-inter mb-1">Filed</p>
              <p className="text-sm text-neutral-800 font-inter">
                {new Date(dispute.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RULE ENGINE FLAGS ─────────────────────────────────────────────────── */}
      {rf.flags?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A2540] font-inter">Automated Analysis</h3>
              <p className="text-xs text-neutral-400 font-inter">{rf.flags.length} issue{rf.flags.length !== 1 ? 's' : ''} detected</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {rf.flags.map((flag, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${SEV_CONFIG[flag.severity]?.bg || 'bg-neutral-50'} ${SEV_CONFIG[flag.severity]?.border || 'border-neutral-200'}`}>
                <span>{SEV_CONFIG[flag.severity]?.icon || 'ℹ️'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold font-inter">{flag.label}</p>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border font-inter ${SEV_CONFIG[flag.severity]?.badge}`}>
                      {flag.severity}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-inter ml-auto">+{flag.riskPoints}pts · {flag.fault}</span>
                  </div>
                  <p className="text-xs font-inter leading-relaxed mt-1 opacity-80">{flag.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI RECOMMENDATION PANEL ──────────────────────────────────────────── */}
      <div className={`bg-white rounded-2xl shadow-sm border ${ai ? 'border-violet-100' : 'border-neutral-100'} p-6`}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A2540] font-inter">AI Analysis & Recommendation</h3>
              <p className="text-xs text-neutral-400 font-inter">Powered by xAI Grok</p>
            </div>
          </div>
          {ai && (
            <button
              onClick={handleRefreshAI}
              className="text-xs text-violet-600 font-semibold font-inter hover:text-violet-800 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          )}
        </div>

        {!ai && (
          <div className="flex items-center gap-3 py-4">
            <svg className="animate-spin w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-neutral-600 font-inter">Grok AI is analyzing the dispute…</p>
              <p className="text-xs text-neutral-400 font-inter">Reviewing order scope, chat logs, delivery, and evidence</p>
            </div>
          </div>
        )}

        {ai && (
          <div className="space-y-4">
            {/* Recommendation with Side Determination */}
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${recConfig.bg} ${recConfig.border}`}>
              <span className="text-2xl">{recConfig.icon}</span>
              <div className="flex-1">
                <p className="text-xs text-neutral-500 font-inter font-semibold uppercase tracking-wider">AI Recommends</p>
                <p className={`text-lg font-black font-inter ${recConfig.color}`}>{recConfig.label}</p>
                <p className="text-xs text-neutral-500 font-inter italic mt-0.5">
                  Favors: {recConfig.color.includes('red') ? 'Buyer' : recConfig.color.includes('emerald') ? 'Seller' : 'Neutral/Compromise'}
                </p>
              </div>
            </div>

            {/* Enhanced Result Determination */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider font-inter mb-3">Result Analysis</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-1">🎯 Primary Factor</p>
                  <p className="text-sm font-medium text-slate-800">
                    {ai.sellerFaultProbability > ai.buyerFaultProbability ? 'Seller Performance' : 
                     ai.buyerFaultProbability > ai.sellerFaultProbability ? 'Buyer Expectations' : 
                     'Communication Issues'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-1">⚖️ Fairness Score</p>
                  <p className="text-sm font-medium text-slate-800">
                    {Math.max(0, Math.min(100, 100 - Math.abs(ai.sellerFaultProbability - ai.buyerFaultProbability) * 100)).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Confidence */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold text-neutral-600 font-inter uppercase tracking-wider">Confidence Level</p>
              </div>
              <ConfidenceBar confidence={ai.confidence} />
            </div>

            {/* Reasoning */}
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
              <p className="text-xs font-bold text-neutral-500 font-inter uppercase tracking-wider mb-2">AI Reasoning</p>
              <p className="text-sm text-neutral-700 font-inter leading-relaxed">{ai.reasoning}</p>
            </div>

            {/* Key Findings */}
            {ai.keyFindings && ai.keyFindings.length > 0 && (
              <div>
                <p className="text-xs font-bold text-neutral-500 font-inter uppercase trackingmb-2">Key Findings</p>
                <ul className="space-y-1.5">
                  {ai.keyFindings.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-inter text-neutral-700">
                      <span className="text-violet-400 mt-0.5 flex-shrink-0">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Enhanced Fault Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider font-inter mb-2">Seller Responsibility</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-orange-100 rounded-full h-2">
                    <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((ai.sellerFaultProbability || 0) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-orange-600 font-inter">{Math.round((ai.sellerFaultProbability || 0) * 100)}%</span>
                </div>
                <p className="text-xs text-orange-700 font-inter">
                  {ai.sellerFaultProbability > 0.6 ? 'High responsibility for issues' :
                   ai.sellerFaultProbability > 0.3 ? 'Partial responsibility' :
                   'Minimal responsibility'}
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider font-intermb-2">Buyer Responsibility</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-blue-100 rounded-full h-2">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((ai.buyerFaultProbability || 0) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-blue-600 font-inter">{Math.round((ai.buyerFaultProbability || 0) * 100)}%</span>
                </div>
                <p className="text-xs text-blue-700 font-inter">
                  {ai.buyerFaultProbability > 0.6 ? 'High responsibility for issues' :
                   ai.buyerFaultProbability > 0.3 ? 'Partial responsibility' :
                   'Minimal responsibility'}
                </p>
              </div>
            </div>

            {/* Fraud Risk Alert */}
            {ai.fraudProbability > 0.2 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-3">
                <span className="text-lg">🚨</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-red-700 font-inter mb-1">Fraud Risk Detected</p>
                  <p className="text-xs text-red-600 font-inter leading-relaxed">
                    <span className="font-bold">{Math.round(ai.fraudProbability * 100)}% probability</span> — 
                    Potential bad-faith behavior detected. Recommend careful review and possible escalation.
                  </p>
                </div>
              </div>
            )}

            {/* Recommendation Justification */}
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl p-4 border border-violet-100">
              <p className="text-xs font-bold text-violet-700 font-inter mb-2">💡 Why This Resolution?</p>
              <div className="text-sm text-violet-800 font-inter leading-relaxed space-y-2">
                <p>
                  Based on the analysis, <strong>{recConfig.label.toLowerCase()}</strong> is recommended because:
                </p>
                <ul className="space-y-1 ml-4">
                  {ai.sellerFaultProbability > 0.6 && (
                    <li className="flex items-start gap-2">
                      <span className="text-violet-500 mt-0.5">•</span>
                      <span>Seller bears primary responsibility ({Math.round(ai.sellerFaultProbability * 100)}% fault)</span>
                    </li>
                  )}
                  {ai.buyerFaultProbability > 0.6 && (
                    <li className="flex items-start gap-2">
                      <span className="text-violet-500 mt-0.5">•</span>
                      <span>Buyer bears primary responsibility ({Math.round(ai.buyerFaultProbability * 100)}% fault)</span>
                    </li>
                  )}
                  {Math.abs(ai.sellerFaultProbability - ai.buyerFaultProbability) < 0.2 && (
                    <li className="flex items-start gap-2">
                      <span className="text-violet-500 mt-0.5">•</span>
                      <span>Shared responsibility suggests compromise or neutral resolution</span>
                    </li>
                  )}
                  {ai.confidence > 0.8 && (
                    <li className="flex items-start gap-2">
                      <span className="text-violet-500 mt-0.5">•</span>
                      <span>High confidence in evidence analysis ({Math.round(ai.confidence * 100)}%)</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTH PARTIES' EVIDENCE ────────────────────────────────────────────── */}
      {((evidenceResponses?.seller?.text || evidenceResponses?.buyer?.text)) && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
              <span>📋</span>
            </div>
            <h3 className="text-sm font-bold text-[#0A2540] font-inter">Submitted Evidence</h3>
          </div>
          <div className="space-y-3">
            {evidenceResponses?.seller?.text && (
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-xs font-bold text-orange-600 font-inter mb-2">🔷 Seller's Response</p>
                <p className="text-sm text-neutral-700 font-inter leading-relaxed">{evidenceResponses.seller.text}</p>
              </div>
            )}
            {evidenceResponses?.buyer?.text && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-blue-600 font-inter mb-2">🔶 Buyer's Statement</p>
                <p className="text-sm text-neutral-700 font-inter leading-relaxed">{evidenceResponses.buyer.text}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SMART ESCALATION ─────────────────────────────────────────────────── */}
      {!escalated && disputeStatus !== 'RESOLVED' && ai && (
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-48">
              <h3 className="text-sm font-bold text-[#0A2540] font-inter mb-1">Not satisfied with the AI recommendation?</h3>
              <p className="text-xs text-neutral-500 font-inter leading-relaxed">
                You can escalate this dispute to a human moderator. An admin will review all evidence and make a final, binding decision.
              </p>
            </div>
            <button
              onClick={() => setShowEscalateModal(true)}
              className="flex-shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-inter font-bold text-sm rounded-xl transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Smart Escalate
            </button>
          </div>
        </div>
      )}

      {/* Escalated status */}
      {escalated && (
        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <p className="text-sm font-bold text-indigo-700 font-inter">Escalated to Human Moderator</p>
              <p className="text-xs text-indigo-500 font-inter">An admin is reviewing your case. You will be notified of the final decision.</p>
            </div>
          </div>
        </div>
      )}

      {/* Resolved status */}
      {disputeStatus === 'RESOLVED' && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏁</span>
            <div>
              <p className="text-sm font-bold text-emerald-700 font-inter">Dispute Resolved</p>
              <p className="text-xs text-emerald-600 font-inter">
                Resolution: <span className="font-bold">{dispute.resolution?.replace(/_/g, ' ')}</span>
                {dispute.resolutionNotes && ` — ${dispute.resolutionNotes}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── ESCALATE MODAL ─────────────────────────────────────────────────── */}
      {showEscalateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-black text-[#0A2540] font-inter">Request Human Review</h3>
                <p className="text-xs text-neutral-400 font-inter">A moderator will make the final binding decision</p>
              </div>
            </div>

            <textarea
              value={escalateReason}
              onChange={e => setEscalateReason(e.target.value)}
              placeholder="(Optional) Why are you requesting human review?"
              rows={3}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm font-inter focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-sm font-inter font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSmartEscalate}
                disabled={escalating}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-inter font-bold transition-colors"
              >
                {escalating ? 'Escalating…' : 'Confirm Escalation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeResolutionFlow;
