import React from 'react';

const REC_CFG = {
  REFUND_BUYER:       { color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-red-200 dark:border-red-900/50',     icon: '💸', label: 'Refund Buyer' },
  RELEASE_TO_SELLER:  { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-900/50', icon: '✅', label: 'Release to Seller' },
  PARTIAL_REFUND:     { color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-200 dark:border-amber-900/50',   icon: '⚖️', label: 'Partial Refund' },
  ESCALATE_TO_HUMAN:  { color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  icon: '👤', label: 'Escalate to Human' },
  ESCALATE:           { color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  icon: '👤', label: 'Needs Human Review' },
};

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
}

function MediaAttachment({ url, gaps }) {
  if (!url) return null;
  // Determine if this URL failed to load by checking evidenceGaps
  const isBroken = gaps?.some(g => g.includes(url) && (g.toLowerCase().includes('failed to load') || g.toLowerCase().includes('could not be included')));

  if (isBroken) {
    return (
      <div className="mt-2 flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg max-w-sm">
        <span className="text-xl">⚠️</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-red-700 dark:text-red-400 truncate">{url.split('/').pop()}</p>
          <p className="text-[10px] text-red-600/80 dark:text-red-400/80">Failed to load or extract evidence</p>
        </div>
      </div>
    );
  }

  const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(url);
  if (isImage) {
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-neutral-200 dark:border-dark-border max-w-sm group relative">
        <img src={url} alt="Evidence attachment" className="w-full h-auto object-contain max-h-48 bg-neutral-100 dark:bg-dark-bg" />
        <a href={url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <span className="text-white text-xs font-bold px-3 py-1.5 bg-black/50 rounded-full backdrop-blur-sm">View Full Image ↗</span>
        </a>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2 p-2 bg-neutral-50 dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-lg max-w-sm group hover:border-indigo-300 transition-colors">
      <span className="text-xl">📄</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-neutral-700 dark:text-dark-primary truncate group-hover:text-indigo-600 transition-colors">{url.split('/').pop()}</p>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 transition-colors">Open</a>
    </div>
  );
}

function ExtractedFactsList({ facts, filterBy, gaps }) {
  if (!facts || facts.length === 0) return <p className="text-sm text-neutral-400 dark:text-dark-muted italic mb-4">No verifiable facts extracted.</p>;
  
  const filtered = facts.filter(f => f.source?.startsWith(filterBy) || (filterBy === 'buyer' && f.source === 'dispute_reason'));
  if (filtered.length === 0) return <p className="text-sm text-neutral-400 dark:text-dark-muted italic mb-4">No facts extracted for this party in this phase.</p>;

  return (
    <ul className="space-y-4 mb-4">
      {filtered.map((f, i) => (
        <li key={i} className="flex gap-2 text-sm text-neutral-700 dark:text-dark-primary font-inter border-l-2 border-indigo-200 pl-3">
          <div className="flex-1 min-w-0">
            <p className="leading-relaxed">{f.fact}</p>
            {f.mediaUrl && <MediaAttachment url={f.mediaUrl} gaps={gaps} />}
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] font-bold text-neutral-400 dark:text-dark-muted bg-neutral-100 dark:bg-dark-bg px-1.5 py-0.5 rounded uppercase">{f.source}</span>
              {f.confidence && <span className="text-[10px] text-neutral-400 dark:text-dark-muted mt-0.5">Conf: {Math.round(f.confidence * 100)}%</span>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function VerdictPanel({ verdict, title, isActive, rawEvents = [], dispute, isVerdict1 }) {
  if (!verdict) {
    return (
      <div className="h-full flex flex-col">
        <h3 className="text-xs font-bold text-neutral-400 dark:text-dark-muted uppercase tracking-wider mb-4 font-inter">{title}</h3>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-neutral-200 dark:border-dark-border rounded-xl bg-neutral-50/50 dark:bg-dark-surface/50">
          <span className="text-3xl mb-3 opacity-20">⏳</span>
          <p className="text-sm font-bold text-neutral-500 dark:text-dark-muted">Not yet challenged</p>
          <p className="text-xs text-neutral-400 dark:text-dark-muted mt-1 max-w-[200px]">The dispute has not progressed to this phase yet.</p>
        </div>
      </div>
    );
  }

  const rec = REC_CFG[verdict.recommendation] || REC_CFG.ESCALATE;
  
  const getSubmission = (role) => {
    const ev = rawEvents?.find(e => e.actorRole === role);
    const payload = ev?.payload || {};
    let text = payload.rebuttal || '';
    
    if (isVerdict1 && dispute?.raisedBy === role && !ev) {
      text = dispute.description || '';
    }

    return {
      text,
      files: payload.evidenceUrls || []
    };
  };

  const buyerSub = getSubmission('buyer');
  const sellerSub = getSubmission('seller');

  return (
    <div className={`h-full flex flex-col ${isActive ? 'ring-2 ring-indigo-500/20 rounded-xl bg-indigo-50/10 dark:bg-indigo-900/10' : 'opacity-80 grayscale-[20%]'}`}>
      <div className="flex items-center justify-between mb-4 px-2 pt-2">
        <h3 className="text-xs font-bold text-neutral-800 dark:text-dark-primary uppercase tracking-wider font-inter flex items-center gap-2">
          {title}
          {isActive && <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full lowercase normal-case tracking-normal">Latest</span>}
        </h3>
      </div>

      <div className={`p-4 rounded-xl border mb-6 ${rec.bg} ${rec.border}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{rec.icon}</span>
          <p className={`text-sm font-bold font-inter ${rec.color}`}>{rec.label}</p>
          {verdict.confidenceScore && (
            <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-md bg-white/50 dark:bg-black/20 border ${rec.border}`}>
              {verdict.confidenceScore}/100 Conf
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-700 dark:text-dark-primary leading-relaxed">{verdict.reasoning || "No reasoning provided."}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 px-2 pb-2">
        {/* Buyer Column */}
        <div className="flex flex-col">
          <h4 className="text-[10px] font-bold text-neutral-400 dark:text-dark-muted uppercase tracking-wider border-b border-neutral-100 dark:border-dark-border pb-2 mb-3">Buyer's Evidence & Facts</h4>
          <div className="flex-1">
            <ExtractedFactsList facts={verdict.extractedFacts} filterBy="buyer" gaps={verdict.evidenceGaps} />
            {(buyerSub.text || buyerSub.files.length > 0) && (
              <div className="mt-4 p-3 bg-neutral-50 dark:bg-dark-surface/50 rounded-lg border border-neutral-100 dark:border-dark-border">
                <h5 className="text-[10px] font-bold text-neutral-500 dark:text-dark-muted uppercase tracking-wider mb-2">Original Submission</h5>
                {buyerSub.text && <p className="text-sm text-neutral-700 dark:text-dark-primary font-inter italic leading-relaxed mb-3">"{buyerSub.text}"</p>}
                {buyerSub.files.length > 0 && (
                  <div className="space-y-2">
                    {buyerSub.files.map((url, i) => <MediaAttachment key={i} url={url} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Seller Column */}
        <div className="flex flex-col">
          <h4 className="text-[10px] font-bold text-neutral-400 dark:text-dark-muted uppercase tracking-wider border-b border-neutral-100 dark:border-dark-border pb-2 mb-3">Seller's Evidence & Facts</h4>
          <div className="flex-1">
            <ExtractedFactsList facts={verdict.extractedFacts} filterBy="seller" gaps={verdict.evidenceGaps} />
            {(sellerSub.text || sellerSub.files.length > 0) && (
              <div className="mt-4 p-3 bg-neutral-50 dark:bg-dark-surface/50 rounded-lg border border-neutral-100 dark:border-dark-border">
                <h5 className="text-[10px] font-bold text-neutral-500 dark:text-dark-muted uppercase tracking-wider mb-2">Original Submission</h5>
                {sellerSub.text && <p className="text-sm text-neutral-700 dark:text-dark-primary font-inter italic leading-relaxed mb-3">"{sellerSub.text}"</p>}
                {sellerSub.files.length > 0 && (
                  <div className="space-y-2">
                    {sellerSub.files.map((url, i) => <MediaAttachment key={i} url={url} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Flags & Gaps */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 px-2 pb-2">
        {verdict.evidenceGaps?.length > 0 && (
          <div className="p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
            <h5 className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-2">Evidence Gaps</h5>
            <ul className="text-xs text-neutral-600 dark:text-dark-muted space-y-1 list-disc pl-4">
              {verdict.evidenceGaps.map((gap, i) => <li key={i}>{gap}</li>)}
            </ul>
          </div>
        )}
        {verdict.evidenceFlags?.length > 0 && (
          <div className="p-3 bg-red-50/50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
            <h5 className="text-[10px] font-bold text-red-600 dark:text-red-500 uppercase tracking-wider mb-2">Anomalies / Flags</h5>
            <ul className="text-xs text-neutral-600 dark:text-dark-muted space-y-1 list-disc pl-4">
              {verdict.evidenceFlags.map((flag, i) => <li key={i}>{flag}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAISummaryTab({ aiEvents, dispute, order, buyer, seller }) {
  const verdict1 = aiEvents?.length > 0 ? aiEvents[0].payload : null;
  const verdict2 = aiEvents?.length > 1 ? aiEvents[aiEvents.length - 1].payload : null;

  return (
    <div className="space-y-6">
      {/* ── HEADER / DISPUTE CONTEXT (Fixed Deed Reading) ── */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-neutral-200 dark:border-dark-border overflow-hidden">
        <div className="border-b border-neutral-100 dark:border-dark-border p-5 bg-neutral-50/50 dark:bg-dark-bg/50">
          <h2 className="text-sm font-bold text-neutral-800 dark:text-dark-primary uppercase tracking-wider font-inter flex items-center gap-2">
            <span className="text-lg">📋</span> Order & Dispute Context
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-neutral-50 dark:bg-dark-bg p-4 rounded-xl border border-neutral-100 dark:border-dark-border">
              <p className="text-[10px] uppercase font-bold text-neutral-400 dark:text-dark-muted font-inter mb-1">Dispute Reason</p>
              <p className="text-sm font-bold text-neutral-800 dark:text-dark-primary font-inter">{dispute?.reason || 'Unknown'}</p>
              <p className="text-xs text-neutral-500 dark:text-dark-muted mt-2 capitalize font-inter">Raised by: <strong className="text-neutral-700 dark:text-dark-primary">{dispute?.raisedBy}</strong></p>
            </div>
            
            <div className="bg-neutral-50 dark:bg-dark-bg p-4 rounded-xl border border-neutral-100 dark:border-dark-border col-span-1 md:col-span-2">
              <p className="text-[10px] uppercase font-bold text-neutral-400 dark:text-dark-muted font-inter mb-1">Buyer's Complaint</p>
              <p className="text-sm text-neutral-700 dark:text-dark-primary font-inter leading-relaxed line-clamp-3">
                {dispute?.description || 'No description provided.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-neutral-100 dark:border-dark-border">
            <div>
              <p className="text-[10px] uppercase font-bold text-neutral-400 dark:text-dark-muted font-inter mb-1">Amount</p>
              <p className="text-sm font-bold text-neutral-800 dark:text-dark-primary font-inter">₹{((order?.amount || 0) / 100).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-neutral-400 dark:text-dark-muted font-inter mb-1">Deadline</p>
              <p className="text-sm font-bold text-neutral-800 dark:text-dark-primary font-inter">{fmt(order?.deadline)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-neutral-400 dark:text-dark-muted font-inter mb-1">Buyer</p>
              <p className="text-sm font-bold text-neutral-800 dark:text-dark-primary font-inter truncate">{buyer ? `${buyer.firstName} ${buyer.lastName}` : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-neutral-400 dark:text-dark-muted font-inter mb-1">Seller</p>
              <p className="text-sm font-bold text-neutral-800 dark:text-dark-primary font-inter truncate">{seller ? `${seller.firstName} ${seller.lastName}` : '—'}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-dark-border">
             <p className="text-[10px] uppercase font-bold text-neutral-400 dark:text-dark-muted font-inter mb-1">Original Order Description</p>
             <p className="text-sm text-neutral-600 dark:text-dark-muted font-inter italic line-clamp-2">{order?.description || 'No description provided.'}</p>
          </div>
        </div>
      </div>

      {/* ── TWO ROW / VERDICT SPLIT ── */}
      <div className="space-y-6">
        {/* VERDICT 1 */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-neutral-200 dark:border-dark-border p-6 relative">
          <VerdictPanel 
            verdict={verdict1} 
            title="Verdict 1 (Initial Submission)" 
            isActive={!verdict2} 
            rawEvents={dispute?.events?.filter(e => e.type === 'EVIDENCE_SUBMITTED') || []}
            dispute={dispute}
            isVerdict1={true}
          />
        </div>

        {/* VERDICT 2 */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-neutral-200 dark:border-dark-border p-6 relative">
          <VerdictPanel 
            verdict={verdict2} 
            title="Verdict 2 (Challenge Submission)" 
            isActive={!!verdict2} 
            rawEvents={dispute?.events?.filter(e => e.type === 'CHALLENGE') || []}
            dispute={dispute}
            isVerdict1={false}
          />
        </div>
      </div>
    </div>
  );
}
