import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';

export default function DeedInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [deed, setDeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDeed = async () => {
      try {
        const response = await axios.get(`/api/deeds/invite/${token}`);
        if (response.data.success) {
          setDeed(response.data.data);
        } else {
          setError('Failed to load deed details.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Deed not found or invite expired.');
      } finally {
        setLoading(false);
      }
    };

    fetchDeed();
  }, [token]);

  const handleAccept = async () => {
    // Check if user is logged in as seller
    const sellerToken = localStorage.getItem('sellerToken');
    if (!sellerToken) {
      toast.error('Please login as a seller to accept this deed.');
      // Save intended destination
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      navigate('/seller/auth');
      return;
    }

    setAccepting(true);
    try {
      const response = await axios.post(`/api/deeds/${deed.id}/accept-seller`, { token }, {
        headers: { Authorization: `Bearer ${sellerToken}` }
      });

      if (response.data.success) {
        toast.success('Deed accepted successfully! Order created.');
        // Redirect to order tracking or seller dashboard
        const orderId = response.data.data.order.id;
        navigate(`/seller/order/${orderId}`);
      } else {
        toast.error(response.data.message || 'Failed to accept deed.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'An error occurred while accepting.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !deed) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-2xl font-bold text-navy-900 mb-2 font-inter">Invite Unavailable</h2>
          <p className="text-neutral-500 mb-6 font-inter">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors font-inter"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Helmet>
        <title>You've been invited to a Deed | ScrowX</title>
        <meta name="description" content="Review and sign your digital deed securely on ScrowX." />
      </Helmet>
      <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full overflow-hidden border border-neutral-100">
        <div className="bg-indigo-600 p-8 text-center text-white relative">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold font-inter mb-2">You've Been Invited!</h1>
          <p className="text-indigo-100 font-inter">A buyer has created a new escrow deed for your services.</p>
        </div>
        
        <div className="p-8">
          <div className="mb-8 bg-neutral-50 p-6 rounded-2xl border border-neutral-200 shadow-inner">
            <h3 className="text-xl font-bold text-navy-900 font-inter mb-4">{deed.title}</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                <span className="text-neutral-500 font-inter">Amount</span>
                <span className="text-xl font-bold text-green-600 font-inter">{deed.currency} {deed.amount}</span>
              </div>
              
              <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                <span className="text-neutral-500 font-inter">Deadline</span>
                <span className="text-navy-900 font-medium font-inter">
                  {deed.deadline ? new Date(deed.deadline).toLocaleDateString() : 'Not specified'}
                </span>
              </div>
              
              <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                <span className="text-neutral-500 font-inter">Type</span>
                <span className="text-navy-900 font-medium font-inter bg-neutral-100 px-3 py-1 rounded-full text-sm">
                  {deed.transactionType}
                </span>
              </div>

              <div>
                <span className="block text-neutral-500 font-inter mb-2">Description / Requirements</span>
                <p className="text-navy-900 font-inter text-sm whitespace-pre-wrap bg-white p-4 rounded-xl border border-neutral-200">
                  {deed.description}
                </p>
              </div>
            </div>
          </div>

          {/* Fee Transparency Block */}
          <div className="mb-8 bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
            <h4 className="flex items-center gap-2 text-sm font-bold text-navy-900 font-inter mb-3">
              <span className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs">i</span>
              Fee Transparency
            </h4>
            <ul className="space-y-2 text-sm text-neutral-600 font-inter list-disc pl-5">
              <li>
                <strong className="text-navy-900">Standard completion fee:</strong> 2.5% (₹{((deed.amount || 0) * 0.025 / 100).toFixed(2)} deducted upon success)
              </li>
              <li>
                <strong className="text-navy-900">Dispute resolution:</strong> In case of a dispute, fee adjusts with an additional 1% or 2% on settled amounts.
              </li>
            </ul>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3 mb-8">
            <span className="text-xl">🔒</span>
            <div>
              <p className="font-semibold text-indigo-900 text-sm font-inter">Secured by ScrowX</p>
              <p className="text-xs text-indigo-700 mt-1 font-inter">
                The buyer has already funded this deed. Once you accept, the funds will be locked and released only once the work is completed and approved.
              </p>
            </div>
          </div>

          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full py-4 bg-navy-900 hover:bg-navy-800 text-white rounded-xl font-bold text-lg transition-all duration-300 font-inter flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
          >
            {accepting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Accepting...
              </>
            ) : (
              'Accept Deed & Start Order'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
