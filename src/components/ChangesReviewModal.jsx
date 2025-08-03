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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-6 relative animate-fadeIn max-h-[90vh] overflow-y-auto">
        <button className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4 text-blue-700">Review Proposed Changes</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Scope Box */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-800 mb-3">Original Scope Box</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Title:</span> {originalScopeBox?.title}</div>
              <div><span className="font-medium">Description:</span> {originalScopeBox?.description}</div>
              <div><span className="font-medium">Product Type:</span> {originalScopeBox?.productType}</div>
              <div><span className="font-medium">Price:</span> ${originalScopeBox?.price}</div>
              <div><span className="font-medium">Deadline:</span> {originalScopeBox?.deadline ? new Date(originalScopeBox.deadline).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-medium">Deliverables:</span>
                <ul className="list-disc ml-4 mt-1">
                  {(originalScopeBox?.deliverables || []).map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* Proposed Changes */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-blue-800 mb-3">Proposed Changes</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Title:</span> {proposedScopeBox?.title}</div>
              <div><span className="font-medium">Description:</span> {proposedScopeBox?.description}</div>
              <div><span className="font-medium">Product Type:</span> {proposedScopeBox?.productType}</div>
              <div><span className="font-medium">Price:</span> ${proposedScopeBox?.price}</div>
              <div><span className="font-medium">Deadline:</span> {proposedScopeBox?.deadline ? new Date(proposedScopeBox.deadline).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-medium">Deliverables:</span>
                <ul className="list-disc ml-4 mt-1">
                  {(proposedScopeBox?.deliverables || []).map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            </div>
            
            {proposedScopeBox?.changeReason && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
                <h4 className="font-medium text-yellow-800 mb-2">Seller's Reason for Changes:</h4>
                <p className="text-sm text-yellow-700">{proposedScopeBox.changeReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Changes Summary */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-800 mb-3">📋 Changes Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Title:</span> 
              <span className={originalScopeBox?.title !== proposedScopeBox?.title ? 'text-blue-600 font-medium' : 'text-gray-600'}>
                {originalScopeBox?.title} → {proposedScopeBox?.title}
              </span>
            </div>
            <div>
              <span className="font-medium">Price:</span> 
              <span className={originalScopeBox?.price !== proposedScopeBox?.price ? 'text-blue-600 font-medium' : 'text-gray-600'}>
                ${originalScopeBox?.price} → ${proposedScopeBox?.price}
              </span>
            </div>
            <div>
              <span className="font-medium">Deadline:</span> 
              <span className={originalScopeBox?.deadline !== proposedScopeBox?.deadline ? 'text-blue-600 font-medium' : 'text-gray-600'}>
                {originalScopeBox?.deadline ? new Date(originalScopeBox.deadline).toLocaleDateString() : 'N/A'} → {proposedScopeBox?.deadline ? new Date(proposedScopeBox.deadline).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium">Deliverables:</span> 
              <span className={JSON.stringify(originalScopeBox?.deliverables) !== JSON.stringify(proposedScopeBox?.deliverables) ? 'text-blue-600 font-medium' : 'text-gray-600'}>
                {originalScopeBox?.deliverables?.length || 0} → {proposedScopeBox?.deliverables?.length || 0} items
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button 
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            onClick={handleRejectChanges}
            disabled={loading}
          >
            {loading ? 'Rejecting...' : 'Reject Changes'}
          </button>
          <button 
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            onClick={handleAcceptChanges}
            disabled={loading}
          >
            {loading ? 'Accepting...' : 'Accept Changes'}
          </button>
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