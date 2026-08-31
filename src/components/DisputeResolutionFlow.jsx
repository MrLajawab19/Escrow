import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// ─── Utilities ────────────────────────────────────────────────────────────────

const SEV_CONFIG = {
  CRITICAL: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-900/50', badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50', icon: '🚨', label: 'Critical' },
  HIGH:     { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700 border-orange-200', icon: '⚠️', label: 'High' },
  MEDIUM:   { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '⚡', label: 'Medium' },
  LOW:      { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-900/50', badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50', icon: 'ℹ️', label: 'Low' },
};

const REC_CONFIG = {
  REFUND_BUYER:       { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-900/50', icon: '💸', label: 'Refund Buyer' },
  RELEASE_TO_SELLER:  { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-900/50', icon: '✅', label: 'Release to Seller' },
  PARTIAL_REFUND:     { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-900/50', icon: '⚖️', label: 'Partial Refund' },
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
          <span className="text-[10px] text-neutral-400 dark:text-dark-muted font-inter -mt-0.5">/ 100</span>
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
      <div className="flex-1 bg-neutral-100 dark:bg-dark-elevated rounded-full h-2.5 overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-1000`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold font-inter text-neutral-700 dark:text-dark-primary w-10 text-right">{pct}%</span>
    </div>
  );
}

function FlagCard({ flag, rootFaultSide }) {
  const sev = SEV_CONFIG[flag.type] || SEV_CONFIG.LOW;
  const label = flag.type || 'Notice';
  
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${sev.bg} ${sev.border}`}>
      <span className="text-lg flex-shrink-0">{sev.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-sm font-bold text-neutral-800 dark:text-dark-primary font-inter capitalize">{label.toLowerCase().replace('_', ' ')}</p>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border font-inter ${sev.badge}`}>
            {sev.label}
          </span>
          {rootFaultSide && (
            <span className="text-[10px] font-semibold text-neutral-400 dark:text-dark-muted font-inter ml-auto">
              Fault side: <span className="capitalize">{rootFaultSide.toLowerCase()}</span>
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-600 dark:text-dark-muted font-inter leading-relaxed mt-1">{flag.reason}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * DisputeResolutionFlow
 * Shows inside DeedDetails when deed.status === 'DISPUTED'
 *
 * Props:
 *  - deedId: string
 *  - deed: Deed object
 *  - userType: 'buyer' | 'seller'
 *  - token: JWT string
 *  - onDeedUpdate: function
 */
const DisputeResolutionFlow = ({ deedId, deed, userType, token, onDeedUpdate }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Evidence submission state
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Challenge state
  const [challenging, setChallenging] = useState(false);
  const [challengeReason, setChallengeReason] = useState('');
  const [challengeFiles, setChallengeFiles] = useState([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [escalated, setEscalated] = useState(false);

  // AI polling
  const [aiPolling, setAiPolling] = useState(false);

  // Scope box details toggle
  const [showScopeBoxDetails, setShowScopeBoxDetails] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const disputeId = deed?.deedDispute?.id || deed?.disputeId;
      const res = await axios.get(`/api/disputes/${disputeId}/full`, { headers });
      if (res.data.success) {
        setDetail(res.data.data);
        if (res.data.data.dispute.status === 'ESCALATED') setEscalated(true);
        if (res.data.data.dispute.evidenceResponses?.[userType]?.submittedAt) setSubmitted(true);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load dispute details');
    } finally {
      setLoading(false);
    }
  }, [deed?.deedDispute?.id, deed?.disputeId, token]);

  useEffect(() => {
    const disputeId = deed?.deedDispute?.id || deed?.disputeId;
    if (disputeId) fetchDetail();
  }, [deed?.deedDispute?.id, deed?.disputeId, fetchDetail]);

  // Poll for AI analysis if not yet available
  useEffect(() => {
    const buyerSubmitted = detail?.dispute?.evidenceResponses?.buyer?.submittedAt;
    const sellerSubmitted = detail?.dispute?.evidenceResponses?.seller?.submittedAt;
    const isProcessing = (buyerSubmitted && sellerSubmitted) || (detail?.dispute?.status && detail.dispute.status !== 'OPEN');

    if (!detail?.dispute?.aiAnalysis && !loading && isProcessing) {
      const interval = setInterval(() => {
        fetchDetail();
      }, 4000);
      setAiPolling(true);
      return () => { clearInterval(interval); setAiPolling(false); };
    } else {
      setAiPolling(false);
    }
  }, [detail?.dispute?.aiAnalysis, detail?.dispute?.status, detail?.dispute?.evidenceResponses, loading]);

  const handleEvidenceSubmit = async (e) => {
    e.preventDefault();
    if (!evidenceText.trim() && evidenceFiles.length === 0) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('rebuttal', evidenceText);
      evidenceFiles.forEach(f => formData.append('files', f));

      await axios.post(
        `/api/disputes/deed/${deedId}/evidence`,
        formData,
        { headers: { ...headers, 'Content-Type': 'multipart/form-data' } }
      );
      setSubmitted(true);
      await fetchDetail();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit evidence');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChallengeSubmit = async (e) => {
    e.preventDefault();
    if (!challengeReason.trim() && challengeFiles.length === 0) return;

    setChallenging(true);
    try {
      const formData = new FormData();
      formData.append('rebuttal', challengeReason);
      challengeFiles.forEach(f => formData.append('files', f));

      await axios.post(
        `/api/disputes/deed/${deedId}/challenge`,
        formData,
        { headers: { ...headers, 'Content-Type': 'multipart/form-data' } }
      );
      setShowChallengeModal(false);
      await fetchDetail();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit challenge');
    } finally {
      setChallenging(false);
    }
  };

  // ─── Loading / Error states ─────────────────────────────────────────────────

  if (loading && !detail) {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-red-100 dark:border-red-900/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
            <span className="text-lg">⚖️</span>
          </div>
          <h2 className="text-base font-bold text-[#0A2540] dark:text-dark-primary font-inter">Dispute Resolution Center</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-neutral-100 dark:bg-dark-elevated rounded-xl h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-red-100 dark:border-red-900/50 p-6 text-center">
        <p className="text-red-500 dark:text-red-400 font-inter text-sm">{error}</p>
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
  
  const counterpartyRole = userType === 'buyer' ? 'seller' : 'buyer';
  const counterpartyChallenge = detail?.dispute?.events?.find(e => e.type === 'CHALLENGE' && e.actorRole === counterpartyRole);
  const myChallenge = detail?.dispute?.events?.find(e => e.type === 'CHALLENGE' && e.actorRole === userType);

  return (
    <div className="space-y-4">

      {/* ── DISPUTE HEADER ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/50 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl">⚖️</span>
            </div>
            <div>
              <h2 className="text-base font-black text-[#0A2540] dark:text-dark-primary font-inter">Dispute Resolution Center</h2>
              <p className="text-xs text-neutral-500 dark:text-dark-muted font-inter mt-0.5">
                Status:&nbsp;
                <span className={`font-bold ${
                  disputeStatus === 'RESOLVED' ? 'text-emerald-600 dark:text-emerald-400' :
                  disputeStatus === 'ESCALATED' ? 'text-indigo-600' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {disputeStatus === 'OPEN' ? 'Under Investigation' :
                   disputeStatus === 'CHALLENGE_PHASE' ? 'Evidence Collected' :
                   disputeStatus === 'ESCALATED' ? 'Human Review Requested' :
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
            <div className="bg-white dark:bg-dark-surface/70 rounded-xl p-3 border border-white">
              <p className="text-[10px] font-semibold text-neutral-500 dark:text-dark-muted uppercase tracking-wider font-inter">Min Word Count</p>
              <p className="text-lg font-black text-[#0A2540] dark:text-dark-primary font-inter">{rf.minWordCount.toLocaleString()}</p>
            </div>
            <div className={`rounded-xl p-3 border ${rf.analyzedWordCount < rf.minWordCount ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50'}`}>
              <p className="text-[10px] font-semibold text-neutral-500 dark:text-dark-muted uppercase tracking-wider font-inter">Words Delivered</p>
              <p className={`text-lg font-black font-inter ${rf.analyzedWordCount < rf.minWordCount ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {rf.analyzedWordCount > 0 ? rf.analyzedWordCount.toLocaleString() : '—'}
              </p>
            </div>
            <div className="bg-white dark:bg-dark-surface/70 rounded-xl p-3 border border-white">
              <p className="text-[10px] font-semibold text-neutral-500 dark:text-dark-muted uppercase tracking-wider font-inter">Gap</p>
              <p className={`text-lg font-black font-inter ${rf.wordCountDelta !== null && rf.wordCountDelta < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
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
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-neutral-200 dark:border-dark-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A2540] dark:text-dark-primary font-inter">Auto-Detection Flags</h3>
              <p className="text-xs text-neutral-400 dark:text-dark-muted font-inter">{rf.flags.length} issue{rf.flags.length !== 1 ? 's' : ''} detected by rule engine</p>
            </div>
          </div>
          <div className="space-y-2">
            {rf.flags.map((flag, i) => <FlagCard key={i} flag={flag} rootFaultSide={rf.faultSide} />)}
          </div>
        </div>
      )}

      {rf.flags && rf.flags.length === 0 && (
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/50 p-5 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-inter">No violations detected by rule engine</p>
            <p className="text-xs text-neutral-400 dark:text-dark-muted font-inter">The AI will analyze the dispute details for further insights</p>
          </div>
        </div>
      )}

      {/* ── EVIDENCE SUBMISSION ──────────────────────────── */}
      {disputeStatus === 'OPEN' && !myEvidenceSubmitted && (
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-indigo-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A2540] dark:text-dark-primary font-inter">
                Your Statement
              </h3>
              <p className="text-xs text-neutral-500 dark:text-dark-muted font-inter font-semibold">
                {rf.faultSide && rf.faultSide.toLowerCase() === myRole
                  ? "The system has flagged issues on your side. Please provide your counter-evidence."
                  : "Please provide any evidence or clarification for your side."}
              </p>
            </div>
          </div>

          <form onSubmit={handleEvidenceSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-dark-muted font-inter mb-1.5">
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
                className="w-full px-4 py-3 border border-neutral-200 dark:border-dark-border rounded-xl text-sm font-inter focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-dark-muted font-inter mb-1.5">
                Upload Supporting Files (optional)
              </label>
              <input
                type="file"
                multiple
                accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={e => setEvidenceFiles(Array.from(e.target.files))}
                className="block w-full text-sm text-neutral-500 dark:text-dark-muted font-inter
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
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 p-4 flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-inter">Your evidence has been submitted</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-inter">The AI will factor in your response. Analysis is being updated.</p>
          </div>
        </div>
      )}

      {/* ── SCOPE BOX ANALYSIS ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
              <span className="text-emerald-600 dark:text-emerald-400">📋</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A2540] dark:text-dark-primary font-inter">Scope Box Analysis</h3>
              <p className="text-xs text-neutral-400 dark:text-dark-muted font-inter">Original requirements vs delivery</p>
            </div>
          </div>
          <button
            onClick={() => setShowScopeBoxDetails(!showScopeBoxDetails)}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-inter hover:text-emerald-800 dark:hover:text-emerald-400 dark:text-emerald-400 flex items-center gap-1"
          >
            {showScopeBoxDetails ? 'Hide' : 'Show'} Details
            <svg className={`w-3 h-3 transform transition-transform ${showScopeBoxDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Scope Compliance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/50">
            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-inter mb-1">Requirements</p>
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-inter">
              {detail.deed?.deliverableFormats?.length || 0}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-inter">deliverables</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-900/50">
            <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-inter mb-1">Deadline</p>
            <p className="text-lg font-black text-blue-700 dark:text-blue-400 font-inter">
              {detail.deed?.deadline ? 
                new Date(detail.deed.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
                'Not set'
              }
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-inter">due date</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-100 dark:border-amber-900/50">
            <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider font-inter mb-1">Value</p>
            <p className="text-lg font-black text-amber-700 dark:text-amber-400 font-inter">
              ₹{detail.deed?.amount ? (detail.deed.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-inter">order value</p>
          </div>
        </div>

        {/* Detailed Scope Box */}
        {showScopeBoxDetails && detail.deed && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/50 space-y-4">
            <div>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-400 mb-2">📝 Description</p>
              <p className="text-sm text-emerald-800 dark:text-emerald-400 leading-relaxed bg-white dark:bg-dark-surface rounded-lg p-3 border border-emerald-200 dark:border-emerald-900/50">
                {detail.deed.description || 'No description provided'}
              </p>
            </div>

            {detail.deed.deliverableFormats && detail.deed.deliverableFormats.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-400 mb-2">✅ Deliverables Required</p>
                <ul className="space-y-1">
                  {detail.deed.deliverableFormats.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-800 dark:text-emerald-400">
                      <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detail.deed.deadline && (
                <div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-400 mb-1">📅 Deadline</p>
                  <p className="text-sm text-emerald-800 dark:text-emerald-400">
                    {new Date(detail.deed.deadline).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    {new Date(detail.deed.deadline) < new Date() ? '⚠️ Overdue' : '⏱️ Pending'}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-400 mb-1">💰 Price</p>
                <p className="text-sm text-emerald-800 dark:text-emerald-400 font-semibold">
                  ₹{detail.deed.amount ? (detail.deed.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Escrow amount</p>
              </div>
            </div>

            {/* Additional Scope Box Fields */}
            {Object.keys(detail.deed.scopeBox).filter(key => 
              !['description', 'deliverables', 'deadline', 'price'].includes(key)
            ).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-400 mb-2">🔧 Additional Requirements</p>
                <div className="bg-white dark:bg-dark-surface rounded-lg p-3 border border-emerald-200 dark:border-emerald-900/50">
                  {Object.entries(detail.deed.scopeBox)
                    .filter(([key]) => !['description', 'deliverables', 'deadline', 'price'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="mb-2 last:mb-0">
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-sm text-emerald-800 dark:text-emerald-400">
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
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-red-100 dark:border-red-900/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
            <span className="text-red-600 dark:text-red-400">⚠️</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0A2540] dark:text-dark-primary font-inter">Dispute Details</h3>
            <p className="text-xs text-neutral-400 dark:text-dark-muted font-inter">What went wrong</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider font-inter mb-1">Reason</p>
            <span className="inline-block px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-semibold rounded-lg border border-red-200 dark:border-red-900/50 font-inter">
              {dispute.reason}
            </span>
          </div>
          
          <div>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider font-inter mb-1">Complaint Details</p>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-900/50">
              <p className="text-sm text-red-800 dark:text-red-400 font-inter leading-relaxed">{dispute.description}</p>
            </div>
          </div>

          {dispute.requestedResolution && (
            <div>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider font-inter mb-1">Requested Resolution</p>
              <p className="text-sm text-red-800 dark:text-red-400 font-inter">{dispute.requestedResolution}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs font-semibold text-neutral-500 dark:text-dark-muted uppercase tracking-wider font-inter mb-1">Raised By</p>
              <p className="text-sm text-neutral-800 dark:text-dark-primary font-inter capitalize">{dispute.raisedBy}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 dark:text-dark-muted uppercase tracking-wider font-inter mb-1">Filed</p>
              <p className="text-sm text-neutral-800 dark:text-dark-primary font-inter">
                {new Date(dispute.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RULE ENGINE FLAGS ─────────────────────────────────────────────────── */}
      {rf.flags?.length > 0 && (
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-orange-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A2540] dark:text-dark-primary font-inter">Automated Analysis</h3>
              <p className="text-xs text-neutral-400 dark:text-dark-muted font-inter">{rf.flags.length} issue{rf.flags.length !== 1 ? 's' : ''} detected</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {rf.flags.map((flag, i) => <FlagCard key={i} flag={flag} rootFaultSide={rf.faultSide} />)}
          </div>
        </div>
      )}

      {/* ── AI RECOMMENDATION PANEL ──────────────────────────────────────────── */}
      <div className={`bg-white dark:bg-dark-surface rounded-2xl shadow-sm border ${ai ? 'border-violet-100' : 'border-neutral-100 dark:border-dark-border'} p-6`}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A2540] dark:text-dark-primary font-inter">AI Analysis & Recommendation</h3>
              <p className="text-xs text-neutral-400 dark:text-dark-muted font-inter">Powered by Google Gemini</p>
            </div>
          </div>
          {/* AI Recommendation title area */}
        </div>

        {!ai && aiPolling && (
          <div className="flex items-center gap-3 py-4">
            <svg className="animate-spin w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-neutral-600 dark:text-dark-muted font-inter">Google Gemini is analyzing the dispute…</p>
              <p className="text-xs text-neutral-400 dark:text-dark-muted font-inter">Reviewing order scope, chat logs, delivery, and evidence</p>
            </div>
          </div>
        )}

        {!ai && !aiPolling && (
          <div className="flex items-center gap-3 py-4">
            <div className="w-5 h-5 flex items-center justify-center text-violet-400">
              <span className="text-lg">⏳</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-600 dark:text-dark-muted font-inter">Waiting for evidence</p>
              <p className="text-xs text-neutral-400 dark:text-dark-muted font-inter">The AI will begin analysis once both parties submit their evidence.</p>
            </div>
          </div>
        )}

        {ai && (
          <div className="space-y-4">
            {/* Recommendation with Side Determination */}
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${recConfig.bg} ${recConfig.border}`}>
              <span className="text-2xl">{recConfig.icon}</span>
              <div className="flex-1">
                <p className="text-xs text-neutral-500 dark:text-dark-muted font-inter font-semibold uppercase tracking-wider">AI Recommends</p>
                <p className={`text-lg font-black font-inter ${recConfig.color}`}>{recConfig.label}</p>
                <p className="text-xs text-neutral-500 dark:text-dark-muted font-inter italic mt-0.5">
                  Favors: {recConfig.color.includes('red') ? 'Buyer' : recConfig.color.includes('emerald') ? 'Seller' : 'Neutral/Compromise'}
                </p>
              </div>
            </div>

            {/* Confidence */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold text-neutral-600 dark:text-dark-muted font-inter uppercase tracking-wider">Confidence Level</p>
              </div>
              <ConfidenceBar confidence={ai.confidenceScore / 100 || 0} />
            </div>

            {/* Reasoning */}
            <div className="bg-neutral-50 dark:bg-dark-bg rounded-xl p-4 border border-neutral-100 dark:border-dark-border">
              <p className="text-xs font-bold text-neutral-500 dark:text-dark-muted font-inter uppercase tracking-wider mb-2">AI Reasoning</p>
              <p className="text-sm text-neutral-700 dark:text-dark-primary font-inter leading-relaxed">{ai.reasoning}</p>
            </div>

            {/* Key Findings */}
            {ai.keyFindings && ai.keyFindings.length > 0 && (
              <div>
                <p className="text-xs font-bold text-neutral-500 dark:text-dark-muted font-inter uppercase trackingmb-2">Key Findings</p>
                <ul className="space-y-1.5">
                  {ai.keyFindings.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-inter text-neutral-700 dark:text-dark-primary">
                      <span className="text-violet-400 mt-0.5 flex-shrink-0">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}


          </div>
        )}
      </div>

      {/* ── BOTH PARTIES' EVIDENCE ────────────────────────────────────────────── */}
      {((evidenceResponses?.seller?.text || evidenceResponses?.buyer?.text)) && (
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-neutral-200 dark:border-dark-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-neutral-100 dark:bg-dark-elevated rounded-lg flex items-center justify-center">
              <span>📋</span>
            </div>
            <h3 className="text-sm font-bold text-[#0A2540] dark:text-dark-primary font-inter">Submitted Evidence</h3>
          </div>
          <div className="space-y-3">
            {evidenceResponses?.seller?.text && (
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-xs font-bold text-orange-600 font-inter mb-2">🔷 Seller's Response</p>
                <p className="text-sm text-neutral-700 dark:text-dark-primary font-inter leading-relaxed">{evidenceResponses.seller.text}</p>
              </div>
            )}
            {evidenceResponses?.buyer?.text && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 font-inter mb-2">🔶 Buyer's Statement</p>
                <p className="text-sm text-neutral-700 dark:text-dark-primary font-inter leading-relaxed">{evidenceResponses.buyer.text}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CHALLENGE PHASE ──────────────────────────────────────────────────── */}
      {disputeStatus === 'CHALLENGE_PHASE' && ai && (
        <div className="space-y-4">
          
          {/* Counterparty Challenge */}
          {counterpartyChallenge && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-900/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="text-sm font-bold text-orange-900 dark:text-orange-400 font-inter capitalize">
                    {counterpartyRole} Challenged the AI Decision
                  </h3>
                  <p className="text-xs text-orange-700 dark:text-orange-500 font-inter">
                    They have submitted the following new allegations/evidence:
                  </p>
                </div>
              </div>
              <div className="bg-white/60 dark:bg-dark-surface/60 rounded-xl p-4 mb-4 text-sm text-neutral-800 dark:text-dark-primary font-inter leading-relaxed">
                {counterpartyChallenge.payload?.rebuttal}
              </div>
              {counterpartyChallenge.payload?.evidenceUrls?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-orange-900 dark:text-orange-400 mb-2">Attached Evidence:</p>
                  <div className="flex flex-wrap gap-2">
                    {counterpartyChallenge.payload.evidenceUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white border border-orange-200 rounded-lg text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:border-indigo-200 transition-colors">
                        View File {i+1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {!myChallenge && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-900/50 flex items-start gap-3 mt-4">
                  <span className="mt-0.5 text-lg">⏰</span>
                  <div className="flex-1">
                    <p className="text-sm text-red-800 dark:text-red-400 font-bold mb-1">
                      Action Required: Submit Your Counter-Challenge
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                      If you do not submit a counter-challenge before the 24-hour challenge window expires, the AI will perform its final re-analysis based solely on the new evidence they submitted.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* My Challenge Submission Box */}
          {!myChallenge && (
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-indigo-100 p-6">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-48">
                  <h3 className="text-sm font-bold text-[#0A2540] dark:text-dark-primary font-inter mb-1">
                    {counterpartyChallenge ? "Submit Counter-Evidence" : "Challenge AI Decision?"}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-dark-muted font-inter leading-relaxed">
                    {counterpartyChallenge 
                      ? "Review the other party's challenge above and submit your counter-evidence for the final AI Verdict."
                      : "If you disagree with the AI's first-pass recommendation or need to respond to the other party's allegations, you can submit a formal challenge with additional context."}
                  </p>
                </div>
                <button
                  onClick={() => setShowChallengeModal(true)}
                  className="flex-shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-inter font-bold text-sm rounded-xl transition-colors flex items-center gap-2"
                >
                  {counterpartyChallenge ? "Submit Counter-Evidence" : "Submit Challenge"}
                </button>
              </div>
            </div>
          )}

          {/* My Challenge Submitted Status */}
          {myChallenge && (
            <div className="bg-indigo-50 rounded-2xl shadow-sm border border-indigo-200 p-6">
              <div className="flex items-center gap-3">
                {!counterpartyChallenge ? (
                  <>
                    <span className="text-2xl">⏳</span>
                    <div>
                      <h3 className="text-sm font-bold text-indigo-900 font-inter">Challenge Submitted</h3>
                      <p className="text-xs text-indigo-700 font-inter mt-1">
                        Your challenge has been submitted successfully. Waiting for the other party to respond or for the challenge window to close.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <svg className="animate-spin w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-bold text-indigo-900 font-inter">Generating Final AI Verdict...</h3>
                      <p className="text-xs text-indigo-700 font-inter mt-1">
                        Both parties have submitted challenges. The AI is now re-analyzing the dispute based on the new evidence.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
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
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏁</span>
            <div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-inter">Dispute Resolved</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-inter">
                Resolution: <span className="font-bold">{dispute.resolution?.replace(/_/g, ' ')}</span>
                {dispute.resolutionNotes && ` — ${dispute.resolutionNotes}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── CHALLENGE MODAL ──────────────────────────────────────────────────── */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">⚖️</span>
              </div>
              <div>
                <h3 className="text-base font-black text-[#0A2540] dark:text-dark-primary font-inter">
                  {counterpartyChallenge ? "Submit Counter-Evidence" : "Submit Challenge"}
                </h3>
                <p className="text-xs text-neutral-400 dark:text-dark-muted font-inter">
                  {counterpartyChallenge ? "Provide evidence to refute their claims." : "Explain why the AI's reasoning is incorrect"}
                </p>
              </div>
            </div>

            <form onSubmit={handleChallengeSubmit}>
              <textarea
                value={challengeReason}
                onChange={e => setChallengeReason(e.target.value)}
                placeholder="What did the AI miss?"
                rows={3}
                className="w-full px-4 py-3 border border-neutral-200 dark:border-dark-border rounded-xl text-sm font-inter focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none mb-3"
                required
              />

              <div className="mb-4">
                <label className="block text-xs font-bold text-neutral-500 dark:text-dark-muted font-inter mb-2">Additional Evidence (Optional)</label>
                <input
                  type="file"
                  multiple
                  onChange={e => setChallengeFiles(Array.from(e.target.files))}
                  className="block w-full text-sm text-neutral-500 dark:text-dark-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowChallengeModal(false)}
                  className="flex-1 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl text-sm font-inter font-semibold text-neutral-600 dark:text-dark-muted hover:bg-neutral-50 dark:hover:bg-dark-elevated dark:bg-dark-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={challenging}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-inter font-bold transition-colors"
                >
                  {challenging ? 'Submitting…' : 'Submit Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeResolutionFlow;

