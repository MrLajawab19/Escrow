import React, { useState } from 'react';
import axios from 'axios';

const RevisionModal = ({ orderId, isOpen, onClose, onSuccess }) => {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!message.trim()) { setError('Please describe the revision needed.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken');
      await axios.post(`/api/orders/${orderId}/revision`,
        { message: message.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('');
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit revision. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-[#0A2540] font-inter text-sm">Request Revision</h3>
              <p className="text-[11px] text-neutral-400 font-inter">Describe what needs to be changed</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <label className="block text-sm font-semibold text-[#0A2540] font-inter mb-2">
            Revision Details <span className="text-red-400">*</span>
          </label>
          <textarea
            value={message}
            onChange={e => { setMessage(e.target.value); setError(''); }}
            rows={4}
            maxLength={1000}
            placeholder="Explain what changes are needed and why..."
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm font-inter text-[#0A2540] bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all resize-none placeholder-neutral-400"
          />
          <div className="flex justify-between items-center mt-1">
            {error ? (
              <p className="text-xs text-red-500 font-inter">{error}</p>
            ) : (
              <span />
            )}
            <span className="text-[11px] text-neutral-400 font-inter">{message.length}/1000</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 rounded-b-2xl flex justify-end gap-3 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold font-inter text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !message.trim()}
            className="px-5 py-2.5 text-sm font-semibold font-inter text-white bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-2"
          >
            {submitting && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {submitting ? 'Submitting…' : 'Submit Revision'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevisionModal;
