import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DisputeTracker = ({ userId, userRole }) => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [filters, setFilters] = useState({
    status: ''
  });

  useEffect(() => {
    fetchUserDisputes();
  }, [userId, userRole, filters]);

  const fetchUserDisputes = async () => {
    try {
      const params = new URLSearchParams({
        ...filters
      });
      
      const response = await axios.get(`http://localhost:3000/api/disputes/user/${userId}/${userRole}?${params}`);
      setDisputes(response.data.data.disputes);
    } catch (error) {
      console.error('Error fetching user disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEvidence = async (disputeId, files, description) => {
    try {
      const formData = new FormData();
      formData.append('addedBy', userRole);
      formData.append('description', description);
      
      files.forEach(file => {
        formData.append('evidence', file);
      });

      await axios.post(`http://localhost:3000/api/disputes/${disputeId}/evidence`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      fetchUserDisputes();
      setSelectedDispute(null);
    } catch (error) {
      console.error('Error adding evidence:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'OPEN': 'bg-red-100 text-red-800',
      'UNDER_REVIEW': 'bg-yellow-100 text-yellow-800',
      'RESPONDED': 'bg-blue-100 text-blue-800',
      'MEDIATION': 'bg-purple-100 text-purple-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getResolutionText = (resolution) => {
    const resolutions = {
      'REFUND_BUYER': 'Refund to Buyer',
      'RELEASE_TO_SELLER': 'Release to Seller',
      'PARTIAL_REFUND': 'Partial Refund',
      'CONTINUE_WORK': 'Continue Work',
      'CANCEL_ORDER': 'Cancel Order'
    };
    return resolutions[resolution] || resolution;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Disputes</h1>
        <p className="mt-2 text-gray-600">Track and manage your dispute cases</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="RESPONDED">Responded</option>
              <option value="MEDIATION">Mediation</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '' })}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Disputes List */}
      <div className="space-y-6">
        {disputes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No disputes found</h3>
            <p className="mt-1 text-sm text-gray-500">You don't have any disputes at the moment.</p>
          </div>
        ) : (
          disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Dispute #{dispute.id.substring(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Order: {dispute.Order?.platform} • Raised: {new Date(dispute.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dispute.status)}`}>
                      {dispute.status}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(dispute.priority)}`}>
                      {dispute.priority}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Dispute Details</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Reason:</strong> {dispute.reason}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Description:</strong> {dispute.description}
                      </p>
                      {dispute.requestedResolution && (
                        <p className="text-sm text-gray-600">
                          <strong>Requested Resolution:</strong> {dispute.requestedResolution}
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Resolution</h4>
                      {dispute.resolution ? (
                        <div className="mt-1">
                          <p className="text-sm text-gray-600">
                            <strong>Outcome:</strong> {getResolutionText(dispute.resolution)}
                          </p>
                          {dispute.resolutionAmount && (
                            <p className="text-sm text-gray-600">
                              <strong>Amount:</strong> ${dispute.resolutionAmount}
                            </p>
                          )}
                          {dispute.resolutionNotes && (
                            <p className="text-sm text-gray-600">
                              <strong>Notes:</strong> {dispute.resolutionNotes}
                            </p>
                          )}
                          {dispute.resolvedAt && (
                            <p className="text-sm text-gray-600">
                              <strong>Resolved:</strong> {new Date(dispute.resolvedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">Pending resolution</p>
                )}
              </div>
                  </div>

                  {/* Evidence */}
                  {dispute.evidenceUrls && dispute.evidenceUrls.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900">Evidence</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {dispute.evidenceUrls.map((url, index) => (
                          <a
                            key={index}
                            href={`http://localhost:3000${url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-blue-600 hover:text-blue-800"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            Evidence {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  {dispute.timeline && dispute.timeline.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900">Timeline</h4>
                      <div className="mt-2 space-y-2">
                        {dispute.timeline.map((event, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-2 w-2 bg-blue-400 rounded-full mt-2"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{event.event}</p>
                              <p className="text-sm text-gray-600">{event.description}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedDispute(dispute)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </button>
                    {dispute.status !== 'RESOLVED' && dispute.status !== 'CLOSED' && (
              <button
                        onClick={() => setSelectedDispute(dispute)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
                      >
                        Add Evidence
              </button>
                    )}
                  </div>
            </div>
          </div>
        </div>
          ))
        )}
      </div>

      {/* Dispute Detail Modal */}
      {selectedDispute && (
        <DisputeDetailModal
          dispute={selectedDispute}
          userRole={userRole}
          onClose={() => setSelectedDispute(null)}
          onAddEvidence={addEvidence}
        />
      )}
    </div>
  );
};

// Dispute Detail Modal Component
const DisputeDetailModal = ({ dispute, userRole, onClose, onAddEvidence }) => {
  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState('');

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmitEvidence = () => {
    if (files.length === 0 || !description.trim()) return;
    onAddEvidence(dispute.id, files, description);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Dispute Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Order Information</h4>
              <p className="text-sm text-gray-600">Platform: {dispute.Order?.platform}</p>
              <p className="text-sm text-gray-600">Status: {dispute.Order?.status}</p>
                  </div>
                  
                    <div>
              <h4 className="font-medium text-gray-900">Dispute Information</h4>
              <p className="text-sm text-gray-600">Raised by: {dispute.raisedBy}</p>
              <p className="text-sm text-gray-600">Reason: {dispute.reason}</p>
              <p className="text-sm text-gray-600">Description: {dispute.description}</p>
              <p className="text-sm text-gray-600">Status: {dispute.status}</p>
              <p className="text-sm text-gray-600">Priority: {dispute.priority}</p>
                    </div>

            {dispute.resolution && (
                    <div>
                <h4 className="font-medium text-gray-900">Resolution</h4>
                <p className="text-sm text-gray-600">Outcome: {dispute.resolution}</p>
                {dispute.resolutionAmount && (
                  <p className="text-sm text-gray-600">Amount: ${dispute.resolutionAmount}</p>
                )}
                {dispute.resolutionNotes && (
                  <p className="text-sm text-gray-600">Notes: {dispute.resolutionNotes}</p>
                )}
                      </div>
                    )}

            {dispute.evidenceUrls && dispute.evidenceUrls.length > 0 && (
                <div>
                <h4 className="font-medium text-gray-900">Evidence</h4>
                <div className="space-y-2">
                  {dispute.evidenceUrls.map((url, index) => (
                    <a
                      key={index}
                      href={`http://localhost:3000${url}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                      className="block text-sm text-blue-600 hover:text-blue-800"
                      >
                      Evidence {index + 1}
                      </a>
                  ))}
                    </div>
                  </div>
                )}

            {dispute.timeline && dispute.timeline.length > 0 && (
                <div>
                <h4 className="font-medium text-gray-900">Timeline</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {dispute.timeline.map((event, index) => (
                    <div key={index} className="text-sm text-gray-600 border-l-2 border-gray-200 pl-3">
                      <p className="font-medium">{event.event}</p>
                      <p>{event.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                          </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Evidence Section */}
            {dispute.status !== 'RESOLVED' && dispute.status !== 'CLOSED' && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Add Evidence</h4>
                <div className="space-y-3">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                    <textarea
                    placeholder="Description of evidence"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={3}
                    />
                    <button
                    onClick={handleSubmitEvidence}
                    disabled={files.length === 0 || !description.trim()}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Submit Evidence
                    </button>
                  </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputeTracker; 