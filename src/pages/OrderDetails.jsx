import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import OrderTimeline from '../components/order/OrderTimeline';
import MilestoneList from '../components/order/MilestoneList';
import DeliveryActions from '../components/order/DeliveryActions';
import OrderChat from '../components/order/OrderChat';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PLACED:            { label: 'Placed',            cls: 'bg-neutral-100 text-neutral-700 border-neutral-300', dot: 'bg-neutral-400' },
  ESCROW_FUNDED:     { label: 'Escrow Funded',     cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',    dot: 'bg-indigo-500' },
  ACCEPTED:          { label: 'Accepted',           cls: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500' },
  IN_PROGRESS:       { label: 'In Progress',        cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
  CHANGES_REQUESTED: { label: 'Changes Requested',  cls: 'bg-orange-50 text-orange-700 border-orange-200',    dot: 'bg-orange-500' },
  SUBMITTED:         { label: 'Delivered',          cls: 'bg-purple-50 text-purple-700 border-purple-200',    dot: 'bg-purple-500' },
  APPROVED:          { label: 'Approved',           cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  RELEASED:          { label: 'Completed',          cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  DISPUTED:          { label: 'Disputed',           cls: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500' },
  REFUNDED:          { label: 'Refunded',           cls: 'bg-neutral-100 text-neutral-600 border-neutral-200', dot: 'bg-neutral-400' },
  CANCELLED:         { label: 'Cancelled',          cls: 'bg-neutral-100 text-neutral-600 border-neutral-200', dot: 'bg-neutral-400' },
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
  <div className={`animate-pulse bg-neutral-200 rounded-xl ${className}`} />
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

// ─── Main Page ────────────────────────────────────────────────────────────────
const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detect user type
  const userType = localStorage.getItem('buyerToken') ? 'buyer' : 'seller';
  const token = localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken');

  // Decode current user for chat
  const getCurrentUser = () => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { userId: payload.userId, role: userType, firstName: payload.firstName, lastName: payload.lastName };
    } catch { return null; }
  };
  const currentUser = getCurrentUser();

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = userType === 'buyer' ? `/api/orders/${orderId}` : `/api/orders/${orderId}`;
      const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setOrder(res.data.data);
      } else {
        setError(res.data.message || 'Order not found');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId, token, userType]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleOrderUpdate = (updated) => setOrder(prev => ({ ...prev, ...updated }));

  const CHAT_ELIGIBLE = ['ESCROW_FUNDED', 'IN_PROGRESS', 'SUBMITTED', 'DISPUTED'];
  const showChat = CHAT_ELIGIBLE.includes(order?.status);

  const statusCfg = STATUS_CONFIG[order?.status] || STATUS_CONFIG.PLACED;
  const timeLeft = timeRemaining(order?.scopeBox?.deadline);
  const dashboardPath = userType === 'buyer' ? '/buyer/dashboard' : '/seller/dashboard';

  return (
    <div className="min-h-screen bg-[#F6F9FC] py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Back button ──────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate(dashboardPath)}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-[#0A2540] font-inter font-medium transition-colors group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>

        {loading && <PageSkeleton />}

        {error && (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-base font-bold text-[#0A2540] font-inter mb-1">Error Loading Order</p>
            <p className="text-sm text-neutral-500 font-inter mb-5">{error}</p>
            <button onClick={fetchOrder} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold font-inter transition-colors">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && order && (
          <>
            {/* ── ORDER HEADER ────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border font-inter uppercase tracking-wide ${statusCfg.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                    {timeLeft && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full font-inter
                        ${timeLeft.urgent ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {timeLeft.label}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#0A2540] font-inter leading-tight">
                    {order.scopeBox?.title || 'Untitled Order'}
                  </h1>
                  <p className="text-xs text-neutral-400 font-inter mt-1 font-mono">
                    Order ID: {order.id}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-3xl font-black text-[#0A2540] font-inter">
                    ${order.scopeBox?.price?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-neutral-400 font-inter mt-0.5">Escrow Amount</p>
                </div>
              </div>
            </div>

            {/* ── TIMELINE ────────────────────────────────────────────────── */}
            <OrderTimeline status={order.status} />

            {/* ── DATE CARDS ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: '📅',
                  label: 'Order Placed',
                  value: formatDate(order.createdAt),
                  sub: null,
                  cls: 'border-neutral-200',
                },
                {
                  icon: '⏰',
                  label: 'Deadline',
                  value: formatDate(order.scopeBox?.deadline),
                  sub: timeLeft?.label,
                  cls: timeLeft?.urgent ? 'border-red-200 bg-red-50/30' : 'border-neutral-200',
                },
                {
                  icon: '💰',
                  label: 'Platform',
                  value: order.platform || 'ScrowX',
                  sub: order.currency || 'USD',
                  cls: 'border-neutral-200',
                },
              ].map((card, i) => (
                <div key={i} className={`bg-white rounded-2xl shadow-sm border p-5 ${card.cls}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{card.icon}</span>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-inter">
                      {card.label}
                    </p>
                  </div>
                  <p className="text-base font-bold text-[#0A2540] font-inter">{card.value}</p>
                  {card.sub && (
                    <p className={`text-xs font-inter mt-0.5 ${timeLeft?.urgent ? 'text-red-500 font-semibold' : 'text-neutral-400'}`}>
                      {card.sub}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* ── SCOPE BOX ───────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-[#0A2540] font-inter">Scope of Work</h2>
              </div>

              <p className="text-sm text-neutral-600 font-inter leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-100 mb-4">
                {order.scopeBox?.description || 'No description provided.'}
              </p>

              {order.scopeBox?.deliverables?.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider font-inter mb-2">
                    Deliverables
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {order.scopeBox.deliverables.map((d, i) => (
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

              {order.scopeBox?.condition && (
                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 font-inter mb-1">Conditions</p>
                  <p className="text-xs text-amber-600 font-inter">{order.scopeBox.condition}</p>
                </div>
              )}
            </div>

            {/* ── MILESTONES ──────────────────────────────────────────────── */}
            {order.milestones?.length > 0 && (
              <MilestoneList milestones={order.milestones} />
            )}

            {/* ── DELIVERY ACTIONS (buyer only when SUBMITTED) ─────────────── */}
            <DeliveryActions
              order={order}
              userType={userType}
              onUpdate={handleOrderUpdate}
            />

            {/* ── ORDER LOGS ──────────────────────────────────────────────── */}
            {order.orderLogs?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h2 className="text-base font-bold text-[#0A2540] font-inter">Activity Log</h2>
                </div>
                <div className="space-y-3">
                  {order.orderLogs.map((log, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-[#0A2540] font-inter">
                          {typeof log === 'string' ? log : log.message || JSON.stringify(log)}
                        </p>
                        {log.timestamp && (
                          <p className="text-[11px] text-neutral-400 font-inter mt-0.5">
                            {formatDate(log.timestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── EMBEDDED CHAT ────────────────────────────────────────────── */}
            {showChat && currentUser && (
              <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-indigo-50 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-base font-bold text-[#0A2540] font-inter">Order Chat</h2>
                  <span className="text-xs text-neutral-400 font-inter ml-auto">
                    Secure · End-to-end
                  </span>
                </div>
                <OrderChat
                  orderId={orderId}
                  currentUser={currentUser}
                  orderStatus={order.status}
                  inline={true}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
