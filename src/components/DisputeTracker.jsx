import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DisputeTracker = ({ orderId, isOpen, onClose }) => {
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');

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

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await axios.post(`/api/disputes/${dispute.id}/respond`, {
        comment: comment.trim()
      });
      
      setComment('');
      fetchDispute(); // Refresh dispute data
      alert('Response submitted successfully!');
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response. Please try again.');
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
                <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                <p className="text-gray-900 bg-gray-50 p-3 rounded">{dispute.description}</p>
              </div>

              {/* Evidence */}
              {dispute.evidenceUrls && dispute.evidenceUrls.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Evidence</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {dispute.evidenceUrls.map((url, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded">
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Evidence {index + 1}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Dispute Raised</p>
                      <p className="text-xs text-gray-500">{new Date(dispute.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {dispute.status === 'RESPONDED' && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Response Received</p>
                        <p className="text-xs text-gray-500">{new Date(dispute.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  
                  {dispute.status === 'RESOLVED' && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Dispute Resolved</p>
                        <p className="text-xs text-gray-500">{new Date(dispute.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Comment */}
              {dispute.status !== 'RESOLVED' && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Add Response</h4>
                  <form onSubmit={handleCommentSubmit} className="space-y-3">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add your response to the dispute..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!comment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        Submit Response
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No dispute found for this order.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisputeTracker; 