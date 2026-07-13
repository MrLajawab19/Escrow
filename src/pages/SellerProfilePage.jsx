import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiUser, FiStar, FiCheckCircle, FiAward, FiClock } from 'react-icons/fi';
import EditProfileModal from '../components/EditProfileModal';
import { Helmet } from 'react-helmet-async';

const SellerProfilePage = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const currentUserDataStr = localStorage.getItem('sellerData');
  const currentUser = currentUserDataStr ? JSON.parse(currentUserDataStr) : null;
  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken') || localStorage.getItem('adminToken');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/profiles/seller/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
      } catch (err) {
        toast.error('Failed to load seller profile');
      } finally {
        setLoading(false);
      }
    };
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

  const { seller, reviews } = profile;

  // Determine badges
  const badges = [];
  if (seller.completedDeeds >= 10) badges.push({ name: 'Trusted Seller', color: 'bg-emerald-100 text-emerald-800' });
  if (seller.rating >= 4.7) badges.push({ name: 'Top Rated', color: 'bg-purple-100 text-purple-800' });
  if (seller.isVerified || seller.kycComplete) badges.push({ name: 'Verified', color: 'bg-blue-100 text-blue-800' });
  if (seller.completedDeeds === 0) badges.push({ name: 'New Seller', color: 'bg-orange-100 text-orange-800' });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pt-24 min-h-screen">
      <Helmet>
        <title>{`${seller.firstName} ${seller.lastName}'s Profile | ScrowX`}</title>
        <meta name="description" content={`View the public profile and transaction history for ${seller.firstName}.`} />
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
          {seller.profileImage ? (
            <img src={`${import.meta.env.VITE_API_URL}${seller.profileImage}`} alt={seller.firstName} className="w-full h-full object-cover" />
          ) : (
            seller.firstName.charAt(0)
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold text-gray-900">{seller.firstName} {seller.lastName}</h1>
          <p className="text-gray-500 mb-4">{seller.country || 'Global'}</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
            {badges.map((b, i) => (
              <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${b.color}`}>
                {b.name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100 min-w-[150px]">
          <div className="flex items-center space-x-1 text-yellow-500 mb-1">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            <span className="text-2xl font-bold text-gray-900">{seller.rating.toFixed(1)}</span>
          </div>
          <p className="text-sm text-gray-500">{reviews.length} reviews</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 text-center">
          <p className="text-2xl font-bold text-gray-900">{seller.totalDeeds}</p>
          <p className="text-sm text-gray-500">Total Deals</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 text-center">
          <p className="text-2xl font-bold text-emerald-600">{seller.completedDeeds}</p>
          <p className="text-sm text-gray-500">Completed</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 text-center">
          <p className="text-2xl font-bold text-gray-900">{seller.createdAt ? new Date(seller.createdAt).getFullYear() : 'N/A'}</p>
          <p className="text-sm text-gray-500">Joined</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 text-center">
          <p className="text-2xl font-bold text-gray-900">100%</p>
          <p className="text-sm text-gray-500">Response Rate</p>
        </div>
      </div>

      {/* Reviews Section */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews ({reviews.length})</h2>
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-neutral-200 text-center text-gray-500">
            No reviews yet.
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    {review.buyer.profileImage ? (
                       <img src={`${import.meta.env.VITE_API_URL}${review.buyer.profileImage}`} className="w-full h-full rounded-full" />
                    ) : review.buyer.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{review.buyer.firstName} {review.buyer.lastName}</p>
                    <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex space-x-1 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-700">{review.comment}</p>
              <div className="mt-3 text-sm text-gray-400">
                Project: <span className="text-gray-600">{review.deed.title}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={seller}
        userType="seller"
        onProfileUpdated={fetchProfile}
      />
    </div>
  );
};

export default SellerProfilePage;
