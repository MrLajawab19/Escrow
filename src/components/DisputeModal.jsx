import React, { useState } from 'react';
import axios from 'axios';

const DisputeModal = ({ isOpen, onClose, orderId, order, onSubmit, userType }) => {
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    evidenceFiles: [],
    requestedResolution: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);

  const disputeReasons = [
    { value: 'QUALITY_ISSUE', label: 'Quality Issue' },
    { value: 'DEADLINE_MISSED', label: 'Deadline Missed' },
    { value: 'FAKE_DELIVERY', label: 'Fake Delivery' },
    { value: 'INCOMPLETE_WORK', label: 'Incomplete Work' },
    { value: 'COMMUNICATION_ISSUE', label: 'Communication Issue' },
    { value: 'SCOPE_CREEP', label: 'Scope Creep' },
    { value: 'PAYMENT_ISSUE', label: 'Payment Issue' },
    { value: 'OTHER', label: 'Other' }
  ];

  const resolutionOptions = [
    { value: 'FULL_REFUND', label: 'Full Refund' },
    { value: 'PARTIAL_REFUND', label: 'Partial Refund' },
    { value: 'REVISION', label: 'Revision Required' },
    { value: 'EXTENSION', label: 'Deadline Extension' },
    { value: 'REPLACEMENT', label: 'Replacement Work' },
    { value: 'DISCOUNT', label: 'Discount on Future Work' },
    { value: 'ESCALATION', label: 'Escalate to Support' },
    { value: 'CUSTOM', label: 'Custom Resolution' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 5; // Maximum 5 files
    const maxSize = 5 * 1024 * 1024; // 5MB per file
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'application/pdf', 
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    // Check if adding these files would exceed the limit
    if (formData.evidenceFiles.length + files.length > maxFiles) {
      setErrors(prev => ({
        ...prev,
        evidenceFiles: `Maximum ${maxFiles} files allowed`
      }));
      return;
    }

    const validFiles = [];
    const invalidFiles = [];

    files.forEach(file => {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(`${file.name} - Invalid file type`);
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name} - File too large (max 5MB)`);
        return;
      }

      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        evidenceFiles: invalidFiles.join(', ')
      }));
    }

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        evidenceFiles: [...prev.evidenceFiles, ...validFiles]
      }));
      setErrors(prev => ({
        ...prev,
        evidenceFiles: ''
      }));
    }
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index)
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.reason) {
      newErrors.reason = 'Please select a reason';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please provide a description';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.requestedResolution) {
      newErrors.requestedResolution = 'Please select a resolution';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Get authentication token
      const token = userType === 'buyer' 
        ? localStorage.getItem('buyerToken') 
        : localStorage.getItem('sellerToken');
      
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      // Create FormData for file upload
      const submitData = new FormData();
      
      // Use order data to get correct IDs
      const buyerId = order?.buyerId || 'buyer-123';
      const sellerId = order?.sellerId || 'seller-456';
      
      submitData.append('orderId', orderId);
      submitData.append('buyerId', buyerId);
      submitData.append('sellerId', sellerId);
      submitData.append('raisedBy', userType);
      submitData.append('reason', formData.reason);
      submitData.append('description', formData.description);
      submitData.append('requestedResolution', formData.requestedResolution);

      // Append multiple files
      formData.evidenceFiles.forEach((file, index) => {
        submitData.append('evidence', file);
      });

      console.log('Submitting dispute with data:', {
        orderId,
        buyerId,
        sellerId,
        raisedBy: userType,
        reason: formData.reason,
        description: formData.description,
        requestedResolution: formData.requestedResolution,
        evidenceFiles: formData.evidenceFiles.length
      });

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/disputes`, submitData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Dispute submitted successfully:', response.data);
      
      // Show success notification
      showNotification('Dispute raised successfully!', 'success');
      
      // Reset form and close modal
      setFormData({
        reason: '',
        description: '',
        evidenceFiles: [],
        requestedResolution: ''
      });
      setErrors({});
      onClose();
      
      // Call parent onSubmit callback
      if (onSubmit) {
        onSubmit(response.data);
      }

    } catch (error) {
      console.error('Error raising dispute:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Response error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('Request error:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to raise dispute. Please try again.';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      reason: '',
      description: '',
      evidenceFiles: [],
      requestedResolution: ''
    });
    setErrors({});
    onClose();
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
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="text-red-500 mr-2">🚨</span>
              Raise Dispute
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Dispute *
              </label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a reason</option>
                {disputeReasons.map(reason => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
              {errors.reason && (
                <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Please provide detailed information about the issue..."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Evidence Upload - Multiple Files */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence Files (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                  multiple
                  className="hidden"
                  id="evidence-upload"
                />
                <label htmlFor="evidence-upload" className="cursor-pointer">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-1 text-sm text-gray-600">
                    Click to upload evidence files
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, JPG, PNG, GIF, TXT up to 5MB each (Max 5 files)
                  </p>
                </label>
              </div>
              
              {/* File List */}
              {formData.evidenceFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                  {formData.evidenceFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {errors.evidenceFiles && (
                <p className="text-red-500 text-sm mt-1">{errors.evidenceFiles}</p>
              )}
            </div>

            {/* Requested Resolution - Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requested Resolution *
              </label>
              <select
                name="requestedResolution"
                value={formData.requestedResolution}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.requestedResolution ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a resolution</option>
                {resolutionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.requestedResolution && (
                <p className="text-red-500 text-sm mt-1">{errors.requestedResolution}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <span className="mr-1">🚨</span>
                    Raise Dispute
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default DisputeModal; 