import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DisputeTracker = ({ orderId, isOpen, onClose }) => {
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchDispute();
    }
  }, [isOpen, orderId]);

  const fetchDispute = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/disputes/${orderId}`);
      setDispute(response.data);
    } catch (error) {
      console.error('Error fetching dispute:', error);
      // If no dispute found, that's okay
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await axios.post(`/api/disputes/${dispute.id}/respond`, {
        comment: comment.trim()
      });
      
      setComment('');
      fetchDispute(); // Refresh dispute data
      showNotification('Response submitted successfully!', 'success');
    } catch (error) {
      console.error('Error submitting response:', error);
      showNotification('Failed to submit response. Please try again.', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESPONDED':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReasonLabel = (reason) => {
    const reasons = {
      'QUALITY_ISSUE': 'Quality Issue',
      'DEADLINE_MISSED': 'Deadline Missed',
      'FAKE_DELIVERY': 'Fake Delivery',
      'INCOMPLETE_WORK': 'Incomplete Work',
      'OTHER': 'Other'
    };
    return reasons[reason] || reason;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Notification Popup */}
      {notification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className={`bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all duration-300 ${
            notification.type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
          }`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {notification.type === 'success' ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="ml-4">
                <h3 className={`text-lg font-medium ${
                  notification.type === 'success' ? 'text-green-900' : 'text-red-900'
                }`}>
                  {notification.type === 'success' ? 'Success!' : 'Error'}
                </h3>
                <p className={`text-sm ${
                  notification.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {notification.message}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setNotification(null)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  notification.type === 'success' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="text-red-500 mr-2">🚨</span>
              Dispute Tracker
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : dispute ? (
              <div className="space-y-6">
                {/* Dispute Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Dispute Details</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dispute.status)}`}>
                      {dispute.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Reason</p>
                      <p className="text-gray-900">{getReasonLabel(dispute.reason)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Created</p>
                      <p className="text-gray-900">{new Date(dispute.createdAt).toLocaleDateString()}</p>
                    </div>
                    {dispute.requestedResolution && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Requested Resolution</p>
                        <p className="text-gray-900">{dispute.requestedResolution}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                    {dispute.description}
                  </p>
                </div>

                {/* Evidence */}
                {dispute.evidence && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Evidence</h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <a 
                        href={dispute.evidence} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View Evidence File
                      </a>
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Comments</h4>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {dispute.comments && dispute.comments.length > 0 ? (
                      dispute.comments.map((comment, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-md">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {comment.userType === 'buyer' ? 'Buyer' : 'Seller'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-900 text-sm">{comment.comment}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No comments yet</p>
                    )}
                  </div>
                </div>

                {/* Add Comment */}
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Comment
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      placeholder="Add your response or comment..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!comment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Response
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No dispute found</h3>
                <p className="text-gray-500">This order doesn't have an active dispute.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DisputeTracker; 