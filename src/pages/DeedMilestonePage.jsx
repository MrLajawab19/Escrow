import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import { CheckCircle, Clock, AlertCircle, UploadCloud } from 'lucide-react';

const DeedMilestonePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [deed, setDeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const { formatCurrency } = useCurrency();

  const userType = location.pathname.includes('/seller/') ? 'seller' : 'buyer';
  const token = localStorage.getItem(`${userType}Token`);

  useEffect(() => {
    fetchDeed();
  }, [id]);

  const fetchDeed = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/deeds/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeed(res.data.data);
    } catch (err) {
      toast.error('Failed to load deed');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (milestoneId, action) => {
    setSubmittingId(milestoneId);
    try {
      let endpoint = '';
      if (action === 'submit') endpoint = `/api/deeds/${id}/milestones/${milestoneId}/submit`;
      else if (action === 'approve') endpoint = `/api/deeds/${id}/milestones/${milestoneId}/approve`;
      else if (action === 'dispute') endpoint = `/api/deeds/${id}/milestones/${milestoneId}/dispute`;

      await axios.patch(`${import.meta.env.VITE_API_URL}${endpoint}`, 
        action === 'dispute' ? { reason: 'Quality issue' } : {}, // simplistic for MVP
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Milestone ${action}ed successfully`);
      fetchDeed();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} milestone`);
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading milestones...</div>;
  if (!deed) return <div className="p-8 text-center text-red-500">Deed not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 font-inter">Milestone Tracker</h1>
        <p className="text-gray-500 mt-1">{deed.title}</p>
      </div>

      {!deed.milestones || deed.milestones.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center text-gray-500">
          This deed does not have any milestones configured.
        </div>
      ) : (
        <div className="space-y-6">
          {deed.milestones.map((m, idx) => (
            <div key={m.id} className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 flex flex-col md:flex-row gap-6">
              {/* Left Column: Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">
                    {idx + 1}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">{m.title}</h3>
                  {m.autoPay && (
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md">
                      Auto-Pay
                    </span>
                  )}
                </div>
                {m.description && <p className="text-gray-600 text-sm mb-3 pl-11">{m.description}</p>}
                
                <div className="pl-11 grid grid-cols-2 gap-4 text-sm text-gray-500 mt-4">
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Amount</span>
                    <span className="font-medium text-gray-900">{formatCurrency(m.amount)}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Deadline</span>
                    <span className="font-medium text-gray-900">
                      {m.deadline ? new Date(m.deadline).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Status & Actions */}
              <div className="w-full md:w-64 shrink-0 flex flex-col items-start md:items-end justify-center border-t md:border-t-0 md:border-l border-neutral-100 pt-4 md:pt-0 md:pl-6">
                
                <div className="mb-4 flex items-center gap-2">
                  {m.status === 'PENDING' && <Clock className="w-5 h-5 text-amber-500" />}
                  {m.status === 'SUBMITTED' && <UploadCloud className="w-5 h-5 text-blue-500" />}
                  {m.status === 'APPROVED' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                  {m.status === 'DISPUTED' && <AlertCircle className="w-5 h-5 text-red-500" />}
                  <span className={`font-semibold ${
                    m.status === 'PENDING' ? 'text-amber-600' :
                    m.status === 'SUBMITTED' ? 'text-blue-600' :
                    m.status === 'APPROVED' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {m.status}
                  </span>
                </div>

                {/* Seller Actions */}
                {userType === 'seller' && m.status === 'PENDING' && (
                  <button 
                    onClick={() => handleAction(m.id, 'submit')}
                    disabled={submittingId === m.id}
                    className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    Submit Work
                  </button>
                )}

                {/* Buyer Actions */}
                {userType === 'buyer' && m.status === 'SUBMITTED' && (
                  <div className="flex gap-2 w-full">
                    <button 
                      onClick={() => handleAction(m.id, 'dispute')}
                      disabled={submittingId === m.id}
                      className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                      Dispute
                    </button>
                    <button 
                      onClick={() => handleAction(m.id, 'approve')}
                      disabled={submittingId === m.id}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </div>
                )}
                
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeedMilestonePage;
