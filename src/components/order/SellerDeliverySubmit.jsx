import React, { useState } from 'react';
import axios from 'axios';

const SellerDeliverySubmit = ({ deed, userType, onUpdate }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (userType !== 'seller' || (deed.status !== 'ACTIVE' && deed.status !== 'IN_PROGRESS' && deed.status !== 'CHANGES_REQUESTED')) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('sellerToken');
      const res = await axios.post(`/api/deeds/${deed.id}/submit`, {
        description,
        fileUrls: [], // For MVP, just sending empty files like milestones do
        externalLinks: []
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (res.data.success) {
        onUpdate?.({ ...deed, status: 'SUBMITTED' });
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-neutral-200 dark:border-dark-border p-6 mt-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-[#0A2540] dark:text-dark-primary font-inter">Submit Delivery</h2>
          <p className="text-xs text-neutral-400 dark:text-dark-muted font-inter">Submit your completed work to the buyer.</p>
        </div>
      </div>
      
      <textarea
        className="w-full border border-neutral-200 dark:border-dark-border rounded-xl p-3 text-sm mb-4 outline-none focus:border-indigo-500 font-inter"
        rows="3"
        placeholder="Add a message for the buyer..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm font-inter flex items-center gap-2">
          <span>❌</span>
          {error}
        </div>
      )}
      
      <button 
        onClick={handleSubmit} 
        disabled={loading}
        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold font-inter transition-colors disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Delivery'}
      </button>
    </div>
  );
};

export default SellerDeliverySubmit;
