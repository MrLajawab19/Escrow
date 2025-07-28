import React, { useState } from 'react';
import axios from 'axios';

const DisputeModal = ({ isOpen, onClose, orderId, onSubmit, userType }) => {
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    evidenceFile: null,
    requestedResolution: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const disputeReasons = [
    { value: 'QUALITY_ISSUE', label: 'Quality Issue' },
    { value: 'DEADLINE_MISSED', label: 'Deadline Missed' },
    { value: 'FAKE_DELIVERY', label: 'Fake Delivery' },
    { value: 'INCOMPLETE_WORK', label: 'Incomplete Work' },
    { value: 'OTHER', label: 'Other' }
  ];

  const resolutionOptions = [
    { value: 'REFUND', label: 'Refund' },
    { value: 'REVISION', label: 'Revision' },
    { value: 'PARTIAL_REFUND', label: 'Partial Refund' },
    { value: 'OTHER', label: 'Other' }
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
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          evidenceFile: 'Please upload a valid file type (JPEG, PNG, GIF, PDF, or TXT)'
        }));
        return;
      }

      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          evidenceFile: 'File size must be less than 5MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        evidenceFile: file
      }));
      setErrors(prev => ({
        ...prev,
        evidenceFile: ''
      }));
    }
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('reason', formData.reason);
      submitData.append('description', formData.description);
      submitData.append('requestedResolution', formData.requestedResolution);
      submitData.append('userId', userType === 'buyer' ? 'buyer-123' : 'seller-456'); // Mock user ID

      if (formData.evidenceFile) {
        submitData.append('evidence', formData.evidenceFile);
      }

      const response = await axios.post(`/api/orders/${orderId}/dispute`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Dispute submitted', response.data);
      
      // Show success toast (you can implement your own toast system)
      alert('Dispute raised successfully!');
      
      // Reset form and close modal
      setFormData({
        reason: '',
        description: '',
        evidenceFile: null,
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
      alert('Failed to raise dispute. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      reason: '',
      description: '',
      evidenceFile: null,
      requestedResolution: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
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

          {/* Evidence Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evidence (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,.pdf,.txt"
                className="hidden"
                id="evidence-upload"
              />
              <label htmlFor="evidence-upload" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-1 text-sm text-gray-600">
                  {formData.evidenceFile ? formData.evidenceFile.name : 'Click to upload evidence'}
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF, PDF, TXT up to 5MB</p>
              </label>
            </div>
            {formData.evidenceFile && (
              <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm text-gray-600">{formData.evidenceFile.name}</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, evidenceFile: null }))}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {errors.evidenceFile && (
              <p className="text-red-500 text-sm mt-1">{errors.evidenceFile}</p>
            )}
          </div>

          {/* Requested Resolution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Resolution (Optional)
            </label>
            <select
              name="requestedResolution"
              value={formData.requestedResolution}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select resolution</option>
              {resolutionOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center justify-center"
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
                'Raise Dispute'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisputeModal; 