import React from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from '../NotificationDropdown';
import { useCurrency } from '../../context/CurrencyContext';
import { Plus, ChevronDown, ShieldCheck, AlertTriangle, ArrowDownToLine } from 'lucide-react';

const DashboardHeader = ({ userData, kycStatus, walletBalance, walletLoading, onKycClick, userType = 'buyer', onDisputesClick, onViewRequestsClick }) => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const firstName = userData?.firstName || 'User';

  return (
    <header className="bg-white border-b border-neutral-200 px-6 lg:px-8 py-4 flex-shrink-0">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Welcome */}
        <div className="flex-shrink-0 min-w-0 pl-10 lg:pl-0">
          <p className="text-xs text-neutral-500 font-medium">Welcome back,</p>
          <h1 className="text-xl font-bold text-navy-900 truncate">
            {firstName} 👋
          </h1>
          <p className="text-xs text-neutral-400 hidden sm:block">
            {userType === 'seller' ? "Here's what's happening with your business today." : "Ready to make your next deal secure?"}
          </p>
        </div>

        {/* Center: KYC Banner */}
        {!kycStatus?.kycComplete && (
          <div className="hidden md:flex items-center gap-3 bg-navy-900 rounded-full px-4 py-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center">
              <ShieldCheck size={16} className="text-amber-400" />
            </div>
            <div className="mr-2">
              <p className="text-xs font-semibold text-white leading-tight">Complete your KYC</p>
              <p className="text-[10px] text-neutral-400 leading-tight">Verify your identity to increase limits & build trust.</p>
            </div>
            <button
              onClick={onKycClick}
              className="px-3 py-1.5 bg-white text-navy-900 text-xs font-semibold rounded-lg hover:bg-neutral-100 transition-colors flex-shrink-0"
            >
              Verify Now
            </button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Wallet Balance */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl">
            <div className="text-right">
              <p className="text-[10px] text-neutral-400 font-medium leading-tight">Wallet Balance</p>
              <p className="text-sm font-bold text-navy-900">
                {walletLoading ? '...' : formatCurrency(walletBalance || 0, 'INR')}
              </p>
            </div>
          </div>

          {/* Notifications */}
          <NotificationDropdown userType={userType} />

          {/* Profile Avatar */}
          <div className="hidden sm:flex items-center gap-2 cursor-pointer group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {userData?.profileImage ? (
                <img
                  src={`${import.meta.env.VITE_API_URL}${userData.profileImage}`}
                  alt={firstName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                firstName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-sm font-semibold text-navy-900 leading-tight">{firstName}</p>
              <p className="text-[10px] text-neutral-400 capitalize">{userType}</p>
            </div>
            <ChevronDown size={14} className="text-neutral-400 group-hover:text-neutral-600 transition-colors" />
          </div>

          {/* Actions */}
          {userType === 'seller' ? (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-neutral-100">
              <button
                onClick={onDisputesClick}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 bg-white text-navy-900 hover:bg-neutral-50 text-sm font-semibold transition-colors"
              >
                <AlertTriangle size={16} className="text-amber-500" />
                <span>My Disputes</span>
              </button>
              <button
                onClick={onViewRequestsClick}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm shadow-indigo-600/20"
              >
                <ArrowDownToLine size={16} />
                <span>View Requests</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/buyer/new-order')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-sm shadow-primary-500/20"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">New Order</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default React.memo(DashboardHeader);
