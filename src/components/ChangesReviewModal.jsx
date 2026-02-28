import React from 'react';
import axios from 'axios';
import NotificationModal from './NotificationModal';

const ChangesReviewModal = ({ order, onClose, onUpdate }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [notification, setNotification] = React.useState({ isOpen: false, title: '', message: '', type: 'success' });

  const handleAcceptChanges = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('buyerToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.patch(`/api/orders/${order.id}/accept-changes`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        onUpdate(response.data.data);
        onClose();
        setNotification({
          isOpen: true,
          title: 'Success',
          message: 'Changes accepted! Order status updated to IN_PROGRESS.',
          type: 'success'
        });
      } else {
        setError(response.data.message || 'Failed to accept changes');
      }
    } catch (error) {
      console.error('Error accepting changes:', error);
      setError('Error accepting changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectChanges = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('buyerToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.patch(`/api/orders/${order.id}/reject-changes`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        onUpdate(response.data.data);
        onClose();
        setNotification({
          isOpen: true,
          title: 'Success',
          message: 'Changes rejected! Order status updated to REJECTED.',
          type: 'success'
        });
      } else {
        setError(response.data.message || 'Failed to reject changes');
      }
    } catch (error) {
      console.error('Error rejecting changes:', error);
      setError('Error rejecting changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  const originalScopeBox = order.scopeBox;
  const proposedScopeBox = order.proposedScopeBox || order.scopeBox;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-elevation max-w-5xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-neutral-200">

        {/* Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-navy-900 tracking-tight">Review Proposed Changes</h2>
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start">
              <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-6">
            {/* Original Scope Box */}
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-neutral-200 bg-neutral-100/50">
                <h3 className="font-bold text-neutral-700 text-sm uppercase tracking-wider flex items-center">
                  Original Scope
                </h3>
              </div>
              <div className="p-5 space-y-4 text-sm">
                <div>
                  <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Title</span>
                  <span className="text-neutral-900 font-medium">{originalScopeBox?.title}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Description</span>
                  <span className="text-neutral-700 leading-relaxed bg-white p-3 rounded border border-neutral-200 block">{originalScopeBox?.description}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Product Type</span>
                    <span className="text-neutral-900 font-medium">{originalScopeBox?.productType}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Price</span>
                    <span className="text-navy-900 font-bold">${originalScopeBox?.price?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Deadline</span>
                    <span className="text-neutral-900 font-medium">{originalScopeBox?.deadline ? new Date(originalScopeBox.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Deliverables</span>
                  <ul className="space-y-1.5">
                    {(originalScopeBox?.deliverables || []).map((d, i) => (
                      <li key={i} className="flex items-start text-neutral-700">
                        <svg className="w-4 h-4 text-neutral-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Proposed Changes */}
            <div className="bg-white rounded-xl border-2 border-indigo-100 overflow-hidden shadow-sm relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500"></div>
              <div className="px-5 py-3 border-b border-indigo-50 bg-indigo-50/30">
                <h3 className="font-bold text-indigo-700 text-sm uppercase tracking-wider flex items-center">
                  Proposed Updates
                </h3>
              </div>
              <div className="p-5 space-y-4 text-sm">
                <div>
                  <span className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Title</span>
                  <span className="text-navy-900 font-medium">{proposedScopeBox?.title}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Description</span>
                  <span className="text-neutral-700 leading-relaxed bg-neutral-50 p-3 rounded border border-neutral-100 block">{proposedScopeBox?.description}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Product Type</span>
                    <span className="text-navy-900 font-medium">{proposedScopeBox?.productType}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Price</span>
                    <span className="text-indigo-700 font-bold">${proposedScopeBox?.price?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Deadline</span>
                    <span className="text-navy-900 font-medium">{proposedScopeBox?.deadline ? new Date(proposedScopeBox.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Deliverables</span>
                  <ul className="space-y-1.5">
                    {(proposedScopeBox?.deliverables || []).map((d, i) => (
                      <li key={i} className="flex items-start text-neutral-700">
                        <svg className="w-4 h-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {proposedScopeBox?.changeReason && (
                <div className="m-5 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Message from Seller
                  </h4>
                  <p className="text-sm text-neutral-700 italic">"{proposedScopeBox.changeReason}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Changes Summary */}
          <div className="mt-8">
            <h4 className="font-bold text-navy-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Summary of Key Differences
            </h4>
            <div className="bg-white border flex flex-col sm:flex-row border-neutral-200 rounded-xl overflow-hidden shadow-sm divide-y sm:divide-y-0 sm:divide-x divide-neutral-200">
              <div className="p-4 flex-1">
                <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Title Changed</span>
                {originalScopeBox?.title !== proposedScopeBox?.title ? (
                  <span className="text-indigo-600 font-bold flex items-center">
                    Yes
                    <svg className="w-4 h-4 ml-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </span>
                ) : <span className="text-neutral-500 font-medium">No</span>}
              </div>
              <div className="p-4 flex-1">
                <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Price Delta</span>
                {originalScopeBox?.price !== proposedScopeBox?.price ? (
                  <div className="text-indigo-600 font-bold flex items-center">
                    ${originalScopeBox?.price?.toLocaleString() || '0'}
                    <svg className="w-4 h-4 mx-1.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    ${proposedScopeBox?.price?.toLocaleString() || '0'}
                  </div>
                ) : <span className="text-neutral-500 font-medium">Unchanged</span>}
              </div>
              <div className="p-4 flex-1">
                <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Timeline Delta</span>
                {originalScopeBox?.deadline !== proposedScopeBox?.deadline ? (
                  <div className="text-indigo-600 font-bold flex flex-col sm:flex-row sm:items-center">
                    <span className="whitespace-nowrap">{originalScopeBox?.deadline ? new Date(originalScopeBox.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}</span>
                    <svg className="w-4 h-4 mx-1.5 text-neutral-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    <span className="whitespace-nowrap">{proposedScopeBox?.deadline ? new Date(proposedScopeBox.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}</span>
                  </div>
                ) : <span className="text-neutral-500 font-medium">Unchanged</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 sm:px-8 py-5 border-t border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row justify-end items-center gap-3">
          <button
            className="btn btn-outline border-neutral-300 text-neutral-700 hover:bg-neutral-100 bg-white w-full sm:w-auto"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              className="btn flex-1 sm:flex-none border border-red-200 text-red-600 hover:bg-red-50 bg-white"
              onClick={handleRejectChanges}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Reject Changes'}
            </button>
            <button
              className="btn btn-primary flex-1 sm:flex-none relative overflow-hidden group"
              onClick={handleAcceptChanges}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Accept All Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
};

export default ChangesReviewModal; 