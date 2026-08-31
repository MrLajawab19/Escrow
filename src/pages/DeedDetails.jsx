import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useCurrency } from '../context/CurrencyContext';
import OrderTimeline from '../components/order/OrderTimeline';
import MilestoneList from '../components/order/MilestoneList';
import DeliveryActions from '../components/order/DeliveryActions';
import SellerDeliverySubmit from '../components/order/SellerDeliverySubmit';
import OrderChat from '../components/order/OrderChat';
import DisputeResolutionFlow from '../components/DisputeResolutionFlow';
import ReviewModal from '../components/ReviewModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  DRAFT:             { label: 'Draft',             cls: 'bg-neutral-100 dark:bg-dark-elevated text-neutral-700 dark:text-dark-primary border-neutral-300 dark:border-dark-border', dot: 'bg-neutral-400' },
  PENDING_SELLER:    { label: 'Pending Seller',    cls: 'bg-orange-50 text-orange-700 border-orange-200',    dot: 'bg-orange-500' },
  PENDING_SIGNATURES:{ label: 'Pending Signatures',cls: 'bg-orange-50 text-orange-700 border-orange-200',    dot: 'bg-orange-500' },
  ESCROW_LOCKED:     { label: 'Escrow Locked',     cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',    dot: 'bg-indigo-500' },
  ACTIVE:            { label: 'Active',            cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
  IN_PROGRESS:       { label: 'In Progress',        cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
  CHANGES_REQUESTED: { label: 'Changes Requested',  cls: 'bg-orange-50 text-orange-700 border-orange-200',    dot: 'bg-orange-500' },
  SUBMITTED:         { label: 'Delivered',          cls: 'bg-purple-50 text-purple-700 border-purple-200',    dot: 'bg-purple-500' },
  CONFIRMED:         { label: 'Confirmed',          cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  CLOSED:            { label: 'Completed',          cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  DISPUTED:          { label: 'Disputed',           cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 border-red-200',             dot: 'bg-red-500' },
  ARBITRATING:       { label: 'Arbitrating',        cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 border-red-200',             dot: 'bg-red-500' },
  ARBITRATED:        { label: 'Arbitrated',         cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  ESCALATED:         { label: 'Escalated',          cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 border-red-200',             dot: 'bg-red-500' },
  CANCELLED:         { label: 'Cancelled',          cls: 'bg-neutral-100 dark:bg-dark-elevated text-neutral-600 dark:text-dark-muted border-neutral-200 dark:border-dark-border', dot: 'bg-neutral-400' },
};

function formatDate(d) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function timeRemaining(deadline) {
  if (!deadline) return null;
  const diff = new Date(deadline) - new Date();
  if (diff <= 0) return { label: 'Deadline passed', urgent: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return { label: `${days}d ${hours}h remaining`, urgent: days <= 2 };
  return { label: `${hours}h remaining`, urgent: true };
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-neutral-200 dark:bg-dark-border rounded-xl ${className}`} />
);

const PageSkeleton = () => (
  <div className="space-y-5">
    <Skeleton className="h-28 w-full" />
    <Skeleton className="h-40 w-full" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
    <Skeleton className="h-48 w-full" />
  </div>
);

// ─── Invite Link Banner (Bug 3 fix) ───────────────────────────────────────────
// Shown only to the buyer while status === PENDING_SELLER. Once the seller joins
// and the status advances, this banner is never rendered — the conditional in
// DeedDetails ensures it. Extracting to its own component is required so that
// useState is called unconditionally at the top level of a proper component.
const InviteLinkBanner = ({ deed }) => {
  const [copied, setCopied] = React.useState(false);
  const inviteUrl = `${window.location.origin}/deed/invite/${deed.inviteToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-indigo-900 font-inter">Awaiting Seller — Share this Invite Link</h3>
        <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200 uppercase tracking-wider font-inter">Pending Seller</span>
      </div>
      <p className="text-xs text-indigo-700 font-inter mb-3">
        Send this link to your seller to join the escrow. The link expires on{' '}
        {new Date(deed.inviteExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 bg-white dark:bg-dark-surface border border-indigo-200 rounded-xl px-3 py-2">
          <p className="text-xs font-mono text-indigo-800 truncate">{inviteUrl}</p>
        </div>
        <button
          onClick={handleCopy}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-inter transition-all ${
            copied
              ? 'bg-emerald-500 text-white border border-emerald-500'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600'
          }`}
        >
          {copied ? (
            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Copied!</>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy Link</>
          )}
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const DeedDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { formatCurrency } = useCurrency();
  const [deed, setDeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Detect user type
  const userType = location.pathname.includes('/seller/') ? 'seller' : 'buyer';
  const token = localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken');

  // Decode current user for chat
  const getCurrentUser = () => {
    try {
      if (!token || token === 'undefined') return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return { userId: payload.userId, role: userType, firstName: payload.firstName, lastName: payload.lastName };
    } catch { return null; }
  };
  const currentUser = getCurrentUser();

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = `/api/deeds/${id}`;
      const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        const deedData = res.data.data;
        if (typeof deedData.ledgerEntries === 'string') {
          try {
            deedData.ledgerEntries = JSON.parse(deedData.ledgerEntries);
          } catch(e) {
            deedData.ledgerEntries = [];
          }
        }
        setDeed(deedData);
      } else {
        setError(res.data.message || 'Order not found');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id, token, userType]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleOrderUpdate = (updated) => setDeed(prev => ({ ...prev, ...updated }));

  const CHAT_ELIGIBLE = ['PENDING_SELLER', 'ACTIVE', 'IN_PROGRESS', 'SUBMITTED', 'DISPUTED'];
  const showChat = CHAT_ELIGIBLE.includes(deed?.status);

  const statusCfg = STATUS_CONFIG[deed?.status] || STATUS_CONFIG.DRAFT;
  // Field resolution: first-class Deed columns are authoritative for all deeds created via
  // the 4-stage NewDeedPage flow. scopeBox fallback preserves legacy deed compatibility.
  const deedTitle       = deed?.title       || deed?.scopeBox?.title;
  const deedAmount      = deed?.amount      ?? deed?.scopeBox?.price ?? 0;
  const deedDescription = deed?.description || deed?.scopeBox?.description;
  const deedDeadline    = deed?.deadline    || deed?.scopeBox?.deadline;
  const deedDeliverables = deed?.deliverableFormats?.length > 0
    ? deed.deliverableFormats
    : deed?.scopeBox?.deliverables || [];

  const isDeadlineIrrelevant = ['CLOSED', 'CANCELLED', 'CONFIRMED', 'DISPUTED', 'ARBITRATING', 'ARBITRATED', 'ESCALATED'].includes(deed?.status);
  const timeLeft = isDeadlineIrrelevant ? null : timeRemaining(deedDeadline);
  const dashboardPath = userType === 'buyer' ? '/buyer/dashboard' : '/seller/dashboard';

  return (
    <div className="min-h-screen bg-[#F6F9FC] dark:bg-dark-bg py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Back button ──────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate(dashboardPath)}
          className="flex items-center gap-2 text-sm text-neutral-500 dark:text-dark-muted hover:text-[#0A2540] dark:hover:text-dark-primary dark:text-dark-primary font-inter font-medium transition-colors group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>

        {loading && <PageSkeleton />}

        {error && (
          <div className="bg-white dark:bg-dark-surface rounded-2xl border border-red-100 shadow-sm p-8 text-center">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-base font-bold text-[#0A2540] dark:text-dark-primary font-inter mb-1">Error Loading Order</p>
            <p className="text-sm text-neutral-500 dark:text-dark-muted font-inter mb-5">{error}</p>
            <button onClick={fetchOrder} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold font-inter transition-colors">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && deed && (
          <>
            {/* ── ORDER HEADER ────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-neutral-200 dark:border-dark-border p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border font-inter uppercase tracking-wide ${statusCfg.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                    {timeLeft && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full font-inter
                        ${timeLeft.urgent ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border border-emerald-100'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {timeLeft.label}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#0A2540] dark:text-dark-primary font-inter leading-tight">
                    {deedTitle || 'Untitled Order'}
                  </h1>
                  <p className="text-xs text-neutral-400 dark:text-dark-muted font-inter mt-1 font-mono">
                    Order ID: {deed.id}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-3xl font-black text-[#0A2540] dark:text-dark-primary font-inter">
                    {formatCurrency(deedAmount, deed.currency || 'INR')}
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-dark-muted font-inter mt-0.5">Escrow Amount</p>
                </div>
              </div>
            </div>

            {/* ── INVITE LINK BANNER (Bug 3) ─ buyer only, PENDING_SELLER only ── */}
            {userType === 'buyer' && deed.status === 'PENDING_SELLER' && deed.inviteToken && (
              <InviteLinkBanner deed={deed} />
            )}

            {/* ── DEED ACTIONS ──────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Link 
                to={`/${userType}/deed/${deed.id}/milestones`}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-medium font-inter hover:bg-indigo-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                View Milestones
              </Link>
              <Link 
                to={`/${userType}/deed/${deed.id}/sign`}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl font-medium font-inter hover:bg-purple-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Digital Signature
              </Link>
              <Link 
                to={`/${userType}/deed/${deed.id}/audit`}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-dark-elevated text-slate-700 dark:text-dark-primary rounded-xl font-medium font-inter hover:bg-slate-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Audit Ledger
              </Link>
            </div>

            {/* ── TIMELINE ────────────────────────────────────────────────── */}
            <OrderTimeline status={deed.status} />

            {/* ── REVIEW BANNER ───────────────────────────────────────────── */}
            {userType === 'buyer' && deed.status === 'CLOSED' && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-emerald-800 font-inter">How was your experience?</h3>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-1">Leave a review for your seller to help them grow.</p>
                </div>
                <button 
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium font-inter shadow-sm transition-colors whitespace-nowrap"
                >
                  Leave a Review
                </button>
              </div>
            )}

            {/* ── DATE CARDS ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: '📅',
                  label: 'Order Placed',
                  value: formatDate(deed.createdAt),
                  sub: null,
                  cls: 'border-neutral-200 dark:border-dark-border',
                },
                {
                  icon: '⏰',
                  label: 'Deadline',
                  value: formatDate(deedDeadline),
                  sub: timeLeft?.label,
                  cls: timeLeft?.urgent ? 'border-red-200 bg-red-50/30' : 'border-neutral-200 dark:border-dark-border',
                },
                {
                  icon: '💰',
                  label: 'Platform',
                  value: deed.platform || 'ScrowX',
                  sub: deed.currency || 'USD',
                  cls: 'border-neutral-200 dark:border-dark-border',
                },
              ].map((card, i) => (
                <div key={i} className={`bg-white dark:bg-dark-surface rounded-2xl shadow-sm border p-5 ${card.cls}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{card.icon}</span>
                    <p className="text-xs font-semibold text-neutral-500 dark:text-dark-muted uppercase tracking-wider font-inter">
                      {card.label}
                    </p>
                  </div>
                  <p className="text-base font-bold text-[#0A2540] dark:text-dark-primary font-inter">{card.value}</p>
                  {card.sub && (
                    <p className={`text-xs font-inter mt-0.5 ${timeLeft?.urgent ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-neutral-400 dark:text-dark-muted'}`}>
                      {card.sub}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* ── SCOPE BOX ───────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-neutral-200 dark:border-dark-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-[#0A2540] dark:text-dark-primary font-inter">Scope of Work</h2>
              </div>

              <p className="text-sm text-neutral-600 dark:text-dark-muted font-inter leading-relaxed bg-neutral-50 dark:bg-dark-bg p-4 rounded-xl border border-neutral-100 dark:border-dark-border mb-4">
                {deedDescription || 'No description provided.'}
              </p>

              {deedDeliverables.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-neutral-500 dark:text-dark-muted uppercase tracking-wider font-inter mb-2">
                    Deliverables
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {deedDeliverables.map((d, i) => (
                      <span key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-100 font-inter">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {d}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {deed.scopeBox?.condition && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 font-inter mb-1">Conditions</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-inter">{deed.scopeBox.condition}</p>
                </div>
              )}
            </div>

            {/* ── MILESTONES ──────────────────────────────────────────────── */}
            {deed.milestones?.length > 0 && (
              <MilestoneList milestones={deed.milestones} />
            )}

            {/* ── DELIVERY ACTIONS (buyer only when SUBMITTED) ─────────────── */}
            <DeliveryActions
              deed={deed}
              userType={userType}
              onUpdate={handleOrderUpdate}
            />

            {/* ── SELLER SUBMIT UI (seller only when ACTIVE) ─────────────── */}
            <SellerDeliverySubmit
              deed={deed}
              userType={userType}
              onUpdate={handleOrderUpdate}
            />

            {/* ── DISPUTE RESOLUTION FLOW (shown when order is DISPUTED) ─────── */}
            {deed.status === 'DISPUTED' && (
              <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-red-100 p-1">
                <div className="px-5 pt-4 pb-2 flex items-center gap-2 border-b border-red-50">
                  <span className="text-lg">⚖️</span>
                  <h2 className="text-base font-bold text-[#0A2540] dark:text-dark-primary font-inter">Dispute Resolution</h2>
                  <span className="ml-auto text-[10px] font-bold px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full border border-red-100 uppercase tracking-wider font-inter">Active</span>
                </div>
                <div className="p-5">
                  <DisputeResolutionFlow
                    deedId={id}
                    deed={deed}
                    userType={userType}
                    token={token}
                    onDeedUpdate={handleOrderUpdate}
                  />
                </div>
              </div>
            )}

            {/* ── FINAL DISPUTE OUTCOME SUMMARY (shown when resolved) ──────── */}
            {deed.deedDispute?.status === 'RESOLVED' && (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-900/50 p-6">
                <div className="flex items-center gap-3 mb-4 border-b border-emerald-100 dark:border-emerald-900/30 pb-4">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🏁</span>
                  </div>
                  <div>
                    <h2 className="text-base font-black text-emerald-900 dark:text-emerald-400 font-inter">Dispute Resolution Finalized</h2>
                    <p className="text-xs text-emerald-700 dark:text-emerald-500 font-inter mt-0.5">
                      This order was disputed and has been permanently closed.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wide mb-1">Final Result</p>
                    <p className="text-sm font-black text-[#0A2540] dark:text-dark-primary font-inter">
                      {deed.deedDispute.resolution?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wide mb-1">Resolved By</p>
                    <p className="text-sm font-black text-[#0A2540] dark:text-dark-primary font-inter capitalize">
                      {deed.deedDispute.resolvedBy === 'system' ? 'AI Arbiter (Auto-Settled)' : 'Human Admin'}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wide mb-2">Resolution Reason</p>
                  <p className="text-sm text-neutral-700 dark:text-dark-muted font-inter leading-relaxed">
                    {deed.deedDispute.resolvedBy === 'system' 
                      ? (deed.deedDispute.aiAnalysis?.reasoning || "Auto-settled via timeout.")
                      : (Array.isArray(deed.deedDispute.timeline) 
                          ? (deed.deedDispute.timeline.find(t => t.event === 'DISPUTE_RESOLVED')?.notes || "Admin resolved without providing notes.")
                          : "Admin resolved.")}
                  </p>
                </div>
              </div>
            )}

            {/* ── LEDGER ENTRIES ──────────────────────────────────────────────── */}
            {deed.ledgerEntries?.length > 0 && (
              <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-neutral-200 dark:border-dark-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-neutral-100 dark:bg-dark-elevated rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-neutral-500 dark:text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h2 className="text-base font-bold text-[#0A2540] dark:text-dark-primary font-inter">Activity Log</h2>
                </div>
                <div className="space-y-3">
                  {deed.ledgerEntries.map((log, i) => {
                    let payloadObj = null;
                    try {
                      if (log.payload) payloadObj = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
                    } catch(e) {}

                    // Human-readable title — replace underscores and title-case
                    const RAW_TITLE_MAP = {
                      DEED_CREATED:       'Deed Created',
                      SELLER_JOINED:      'Seller Joined',
                      DEED_LOCKED:        'Deed Locked',
                      FUNDS_LOCKED:       'Funds Locked in Escrow',
                      DELIVERY_CLAIMED:   'Delivery Submitted',
                      DELIVERY_CONFIRMED: 'Delivery Confirmed',
                      PAYMENT_RELEASED:   'Payment Released',
                      PAYMENT_REFUNDED:   'Payment Refunded',
                      CHANGES_REQUESTED:  'Changes Requested',
                      CHANGES_ACCEPTED:   'Changes Accepted',
                      DISPUTE_RAISED:     'Dispute Raised',
                      EVIDENCE_SUBMITTED: 'Evidence Submitted',
                      DISPUTE_CHALLENGE:  'Verdict Challenged',
                      AI_VERDICT_ISSUED:  'AI Verdict Issued',
                      DISPUTE_ESCALATED:  'Escalated to Human Review',
                      DISPUTE_RESOLVED:   'Dispute Resolved',
                    };
                    const eventTitle = RAW_TITLE_MAP[log.eventType] || (log.eventType || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                    // Dot color per event semantic
                    const DOT_COLOR = {
                      DISPUTE_RAISED:     'bg-red-500',
                      EVIDENCE_SUBMITTED: 'bg-amber-400',
                      DISPUTE_CHALLENGE:  'bg-purple-400',
                      AI_VERDICT_ISSUED:  'bg-blue-400',
                      DISPUTE_ESCALATED:  'bg-orange-500',
                      DISPUTE_RESOLVED:   'bg-emerald-500',
                    };
                    const dotCls = DOT_COLOR[log.eventType] || 'bg-indigo-400';

                    return (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full ${dotCls} mt-1.5 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#0A2540] dark:text-dark-primary font-inter font-medium">
                          {eventTitle}
                        </p>
                        
                        {payloadObj && log.eventType === 'CHANGES_REQUESTED' && (
                          <div className="mt-1.5 p-2.5 bg-orange-50 border border-orange-100 rounded-lg text-xs text-orange-800 font-inter">
                            <span className="font-bold block mb-0.5">Feedback: {payloadObj.reason}</span>
                            {payloadObj.description && <span className="block text-orange-700">{payloadObj.description}</span>}
                          </div>
                        )}
                        
                        {payloadObj && log.eventType === 'DELIVERY_CLAIMED' && (
                          <div className="mt-1.5 p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-800 font-inter">
                            {payloadObj.description && <span className="italic block mb-0.5">"{payloadObj.description}"</span>}
                            {payloadObj.fileCount > 0 && <span className="font-semibold block">{payloadObj.fileCount} file(s) attached</span>}
                          </div>
                        )}

                        {payloadObj && log.eventType === 'DISPUTE_RAISED' && (
                          <div className="mt-1.5 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-lg text-xs text-red-800 font-inter">
                            <span className="font-bold block">Reason: {payloadObj.reason}</span>
                          </div>
                        )}

                        {payloadObj && log.eventType === 'EVIDENCE_SUBMITTED' && (
                          <div className="mt-1.5 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 rounded-lg text-xs text-amber-800 font-inter">
                            {payloadObj.isLate && <span className="font-bold block text-red-600">Submitted late</span>}
                            {payloadObj.fileCount > 0
                              ? <span className="block">{payloadObj.fileCount} file(s) attached</span>
                              : <span className="block text-amber-700">Text evidence only</span>}
                          </div>
                        )}

                        {payloadObj && log.eventType === 'DISPUTE_CHALLENGE' && (
                          <div className="mt-1.5 p-2.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 rounded-lg text-xs text-purple-800 font-inter">
                            <span className="block">Formal challenge submitted to AI verdict</span>
                            {payloadObj.fileCount > 0 && <span className="block">{payloadObj.fileCount} supporting file(s) attached</span>}
                          </div>
                        )}

                        {payloadObj && log.eventType === 'AI_VERDICT_ISSUED' && (
                          <div className="mt-1.5 p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 rounded-lg text-xs text-blue-800 font-inter">
                            <span className="font-bold block">
                              {payloadObj.isReAnalysis ? 'Verdict 2 (Re-analysis)' : 'Verdict 1 (First Pass)'}
                              {' — '}{(payloadObj.recommendation || '').replace(/_/g, ' ')}
                            </span>
                            {payloadObj.confidenceScore != null && (
                              <span className="block text-blue-700">Confidence: {payloadObj.confidenceScore}%</span>
                            )}
                          </div>
                        )}

                        {payloadObj && log.eventType === 'DISPUTE_ESCALATED' && (
                          <div className="mt-1.5 p-2.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 rounded-lg text-xs text-orange-800 font-inter">
                            <span className="font-bold block">An admin will review and issue the final decision</span>
                          </div>
                        )}

                        {payloadObj && log.eventType === 'DISPUTE_RESOLVED' && (
                          <div className="mt-1.5 p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 rounded-lg text-xs text-emerald-800 font-inter">
                            <span className="font-bold block">
                              Resolution: {(payloadObj.resolution || '').replace(/_/g, ' ')}
                            </span>
                            {payloadObj.finalBuyerPct != null && payloadObj.finalBuyerPct !== 100 && payloadObj.finalBuyerPct !== 0 && (
                              <span className="block text-emerald-700">Buyer: {payloadObj.finalBuyerPct}% · Seller: {100 - payloadObj.finalBuyerPct}%</span>
                            )}
                          </div>
                        )}

                        {log.timestamp && (
                          <p className="text-[11px] text-neutral-400 dark:text-dark-muted font-inter mt-1">
                            {formatDate(log.timestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            )}

            {/* ── EMBEDDED CHAT ────────────────────────────────────────────── */}
            {showChat && currentUser && (
              <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-indigo-50 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-base font-bold text-[#0A2540] dark:text-dark-primary font-inter">Order Chat</h2>
                  <span className="text-xs text-neutral-400 dark:text-dark-muted font-inter ml-auto">
                    Secure · End-to-end
                  </span>
                </div>
                <OrderChat
                  deedId={id}
                  currentUser={currentUser}
                  orderStatus={deed.status}
                  inline={true}
                />
              </div>
            )}

            <ReviewModal 
              isOpen={isReviewModalOpen} 
              onClose={() => setIsReviewModalOpen(false)} 
              deedId={deed.id}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default DeedDetails;
