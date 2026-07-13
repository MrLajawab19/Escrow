import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import EditProfileModal from '../components/EditProfileModal';
import { Helmet } from 'react-helmet-async';

const BuyerProfilePage = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { formatCurrency } = useCurrency();

  const currentUserDataStr = localStorage.getItem('buyerData');
  const currentUser = currentUserDataStr ? JSON.parse(currentUserDataStr) : null;
  const isOwnProfile = currentUser?.id === id;

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken') || localStorage.getItem('adminToken');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/profiles/buyer/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
    } catch (err) {
      toast.error('Failed to load buyer profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-20">
      <Helmet>
        <title>Profile | ScrowX</title>
      </Helmet>
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!profile) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-20">
      <Helmet>
        <title>Profile Not Found | ScrowX</title>
      </Helmet>
      <div className="text-gray-500">Profile not found</div>
    </div>
  );

  const { buyer, stats } = profile;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-12 min-h-screen">
      <Helmet>
        <title>{`${buyer.firstName} ${buyer.lastName}'s Profile | ScrowX`}</title>
        <meta name="description" content={`View the public profile and transaction history for ${buyer.firstName}.`} />
      </Helmet>
      
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative">
        {isOwnProfile && (
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="absolute top-6 right-6 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            Edit Picture
          </button>
        )}
        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-3xl text-slate-400 overflow-hidden shrink-0">
          {buyer.profileImage ? (
            <img src={`${import.meta.env.VITE_API_URL}${buyer.profileImage}`} alt={buyer.firstName} className="w-full h-full object-cover" />
          ) : (
            buyer.firstName.charAt(0)
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold text-gray-900">{buyer.firstName} {buyer.lastName}</h1>
          <p className="text-gray-500 mb-4">{buyer.country || 'Global'}</p>
          <div className="flex justify-center md:justify-start gap-2">
            {(buyer.isVerified || buyer.kycComplete) && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Verified Buyer
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Joined {buyer.createdAt ? new Date(buyer.createdAt).getFullYear() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 text-center">
          <p className="text-3xl font-bold text-gray-900">{stats.totalDeeds}</p>
          <p className="text-sm text-gray-500 mt-1">Total Deeds</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-neutral-200 text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.activeDeedsCount}</p>
          <p className="text-sm text-gray-500 mt-1">Active Deeds</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-neutral-200 text-center">
          <p className="text-3xl font-bold text-emerald-600">{formatCurrency(stats.totalSpent)}</p>
          <p className="text-sm text-gray-500 mt-1">Total Spent</p>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={buyer}
        userType="buyer"
        onProfileUpdated={fetchProfile}
      />
    </div>
  );
};

export default BuyerProfilePage;
