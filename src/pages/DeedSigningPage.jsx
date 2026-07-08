import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileSignature, ShieldCheck, Clock, FileText } from 'lucide-react';

const DeedSigningPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [deed, setDeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);

  const userType = location.pathname.includes('/seller/') ? 'seller' : 'buyer';
  const token = localStorage.getItem(`${userType}Token`);
  const currentUserId = JSON.parse(localStorage.getItem(`${userType}Data`) || '{}').id;

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
      toast.error('Failed to load deed for signing');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!agreed) {
      toast.error('You must agree to the terms to sign.');
      return;
    }
    setSigning(true);
    try {
      const endpoint = userType === 'buyer' ? `/api/deeds/${id}/sign-buyer` : `/api/deeds/${id}/sign-seller`;
      await axios.post(`${import.meta.env.VITE_API_URL}${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deed signed successfully');
      fetchDeed();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sign deed');
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading deed...</div>;
  if (!deed) return null;

  const hasBuyerSigned = !!deed.buyerSignedAt;
  const hasSellerSigned = !!deed.sellerSignedAt;
  
  const iHaveSigned = userType === 'buyer' ? hasBuyerSigned : hasSellerSigned;
  const theyHaveSigned = userType === 'buyer' ? hasSellerSigned : hasBuyerSigned;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-neutral-200 p-6 sm:p-8 flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <FileSignature className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-inter">Digital Deed Signing</h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="font-mono text-sm bg-gray-200 text-gray-700 px-2 py-0.5 rounded">{deed.id.substring(0, 8)}...</span>
              Review the final terms before locking the escrow contract.
            </p>
          </div>
        </div>

        {/* Content Review */}
        <div className="p-6 sm:p-8 border-b border-neutral-200">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-400" /> Contract Terms
          </h3>
          
          <div className="bg-slate-50 rounded-xl p-6 space-y-4 text-sm text-gray-700 border border-slate-100">
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Title</span>
              <p className="font-medium text-gray-900 text-base">{deed.title}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Amount</span>
                <p className="font-medium text-gray-900 text-base">{deed.currency} {deed.amount}</p>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Deadline</span>
                <p className="font-medium text-gray-900">
                  {deed.deadline ? new Date(deed.deadline).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Description</span>
              <p className="whitespace-pre-wrap">{deed.description}</p>
            </div>
            
            <div className="pt-4 border-t border-slate-200">
              <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Acceptance Criteria</span>
              <p className="whitespace-pre-wrap">{deed.acceptanceCriteria}</p>
            </div>
          </div>
        </div>

        {/* Signatures & Status */}
        <div className="p-6 sm:p-8 bg-slate-50">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className={`flex-1 p-4 rounded-xl border ${hasBuyerSigned ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">Buyer Signature</span>
                {hasBuyerSigned ? <ShieldCheck className="w-5 h-5 text-emerald-500" /> : <Clock className="w-5 h-5 text-gray-400" />}
              </div>
              {hasBuyerSigned ? (
                <p className="text-xs text-emerald-700 font-mono">Signed at {new Date(deed.buyerSignedAt).toLocaleString()}</p>
              ) : (
                <p className="text-xs text-gray-500">Awaiting signature...</p>
              )}
            </div>
            <div className={`flex-1 p-4 rounded-xl border ${hasSellerSigned ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">Seller Signature</span>
                {hasSellerSigned ? <ShieldCheck className="w-5 h-5 text-emerald-500" /> : <Clock className="w-5 h-5 text-gray-400" />}
              </div>
              {hasSellerSigned ? (
                <p className="text-xs text-emerald-700 font-mono">Signed at {new Date(deed.sellerSignedAt).toLocaleString()}</p>
              ) : (
                <p className="text-xs text-gray-500">Awaiting signature...</p>
              )}
            </div>
          </div>

          {deed.contentHash && (
            <div className="mb-8 p-4 bg-gray-900 rounded-xl text-gray-300 font-mono text-xs break-all border border-gray-700 flex items-start gap-3 shadow-inner">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="block text-gray-500 mb-1 uppercase tracking-wider">Cryptographic Hash (SHA-256)</span>
                {deed.contentHash}
              </div>
            </div>
          )}

          {!iHaveSigned ? (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  I agree to the terms listed above. I understand that signing this deed constitutes a legally binding agreement under ScrowX Terms of Service.
                </span>
              </label>
              <button
                onClick={handleSign}
                disabled={!agreed || signing}
                className="mt-6 w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold font-inter transition-colors disabled:opacity-50 shadow-sm"
              >
                {signing ? 'Signing...' : 'Sign Digitally'}
              </button>
            </div>
          ) : (
            <div className="text-center p-6">
              <p className="text-emerald-600 font-medium flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                You have successfully signed this deed.
              </p>
              {!theyHaveSigned && (
                <p className="text-gray-500 text-sm mt-2">Waiting for the other party to sign...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeedSigningPage;
