import React, { useState } from 'react';
import axios from 'axios';
import RevisionModal from './RevisionModal';

const DeliveryActions = ({ order, userType, onUpdate }) => {
  const [showRevision, setShowRevision] = useState(false);
  const [loading, setLoading] = useState('');
  const [notice, setNotice] = useState(null);

  const token = localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken');
  const headers = { Authorization: `Bearer ${token}` };

  const showNotice = (msg, type = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleRelease = async () => {
    setLoading('release');
    try {
      const res = await axios.patch(`/api/orders/${order.id}/release`, {}, { headers });
      if (res.data.success) {
        showNotice('Funds released! Order completed.');
        onUpdate?.({ ...order, status: 'RELEASED' });
      } else {
        showNotice(res.data.message || 'Failed to release funds', 'error');
      }
    } catch (e) {
      showNotice(e.response?.data?.message || 'Error releasing funds', 'error');
    } finally {
      setLoading('');
    }
  };

  const isSubmitted = order.status === 'SUBMITTED';
  const canRequestRevision = isSubmitted &&
    (order.revisionsAllowed ?? 2) > (order.revisionsUsed ?? 0);

  if (!isSubmitted || userType !== 'buyer') return null;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0A2540] font-inter">Delivery Received</h2>
            <p className="text-xs text-neutral-400 font-inter">Seller has submitted the work for your review</p>
          </div>
        </div>

        {/* Delivery Files */}
        {order.deliveryFiles?.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 font-inter">
              Submitted Files
            </p>
            <div className="space-y-2">
              {order.deliveryFiles.map((file, i) => (
                <div key={i}
                  className="flex items-center gap-3 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                  <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="text-sm font-inter text-[#0A2540] truncate">{file}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revisions remaining */}
        <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-amber-50 rounded-xl border border-amber-100">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p className="text-xs font-inter text-amber-700">
            <span className="font-bold">{(order.revisionsAllowed ?? 2) - (order.revisionsUsed ?? 0)}</span> revision{(order.revisionsAllowed ?? 2) - (order.revisionsUsed ?? 0) !== 1 ? 's' : ''} remaining
          </p>
        </div>

        {/* Notice */}
        {notice && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-inter flex items-center gap-2
            ${notice.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
            <span>{notice.type === 'error' ? '❌' : '✅'}</span>
            {notice.msg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRelease}
            disabled={loading === 'release'}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white text-sm font-semibold rounded-xl transition-all font-inter shadow-sm"
          >
            {loading === 'release' ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            Accept & Release Funds
          </button>

          <button
            onClick={() => setShowRevision(true)}
            disabled={!canRequestRevision}
            title={!canRequestRevision ? 'Revision limit reached' : 'Request changes'}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-200 disabled:cursor-not-allowed text-white disabled:text-neutral-400 text-sm font-semibold rounded-xl transition-all font-inter"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Request Revision
          </button>
        </div>
      </div>

      <RevisionModal
        orderId={order.id}
        isOpen={showRevision}
        onClose={() => setShowRevision(false)}
        onSuccess={() => showNotice('Revision request submitted!')}
      />
    </>
  );
};

export default DeliveryActions;
