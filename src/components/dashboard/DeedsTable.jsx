import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { useCurrency } from '../../context/CurrencyContext';
import { ChevronRight } from 'lucide-react';

const BUYER_ACCEPTED_GRACE_MS = 60 * 60 * 1000;

function sellerAcceptedAtMs(deed) {
  if (deed.sellerSignedAt) return new Date(deed.sellerSignedAt).getTime();
  const log = [...(deed.ledgerEntries || [])].reverse().find((l) => l.eventType === 'SELLER_JOINED');
  return log?.timestamp ? new Date(log.timestamp).getTime() : 0;
}

function getDisplayStatus(deed, userType) {
  const st = deed.status;
  if (userType === 'seller') return st;
  
  if (st !== 'ACTIVE') return st;
  const at = sellerAcceptedAtMs(deed);
  if (at && Date.now() - at < BUYER_ACCEPTED_GRACE_MS) return 'ACCEPTED';
  return 'ACTIVE';
}

const filterTabs = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'pending_review', label: 'Pending Review' },
  { key: 'completed', label: 'Completed' },
  { key: 'disputed', label: 'Disputed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const serviceIcons = [
  { bg: 'bg-primary-500', icon: '▶' },
  { bg: 'bg-secondary-500', icon: '</>' },
  { bg: 'bg-amber-500', icon: '🎨' },
  { bg: 'bg-rose-500', icon: '✦' },
  { bg: 'bg-emerald-500', icon: '✎' },
  { bg: 'bg-cyan-500', icon: '⚡' },
  { bg: 'bg-violet-500', icon: '◆' },
  { bg: 'bg-orange-500', icon: '☆' },
];

function getServiceIcon(index) {
  return serviceIcons[index % serviceIcons.length];
}

function filterDeeds(deeds, filterKey) {
  switch (filterKey) {
    case 'in_progress':
      return deeds.filter(d => ['IN_PROGRESS', 'ESCROW_LOCKED', 'ACTIVE', 'ACCEPTED'].includes(d.status));
    case 'pending_review':
      return deeds.filter(d => d.status === 'SUBMITTED');
    case 'completed':
      return deeds.filter(d => ['CONFIRMED', 'CLOSED', 'RELEASED'].includes(d.status));
    case 'disputed':
      return deeds.filter(d => ['DISPUTED', 'ARBITRATING', 'ARBITRATED', 'ESCALATED'].includes(d.status));
    case 'cancelled':
      return deeds.filter(d => ['CANCELLED', 'REJECTED'].includes(d.status));
    default:
      return deeds;
  }
}

const DeedsTable = ({ deeds, onViewAllDeeds, userType = 'buyer' }) => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredDeeds = useMemo(
    () => filterDeeds(deeds, activeFilter),
    [deeds, activeFilter]
  );

  const handleDeedClick = (deed) => {
    const deedId = deed.id;
    navigate(`/${userType}/deed/${deedId}`);
  };

  const getCounterpartyName = (deed) => {
    if (userType === 'seller') {
      if (deed.buyer) return `${deed.buyer.firstName || ''} ${deed.buyer.lastName || ''}`.trim();
      return deed.buyerName || 'Buyer';
    } else {
      if (deed.seller) return `${deed.seller.firstName || ''} ${deed.seller.lastName || ''}`.trim();
      if (deed.sellerName) return deed.sellerName;
      return 'Seller';
    }
  };
  
  const getCounterpartyAvatar = (deed) => {
    if (userType === 'seller') {
      return deed.buyer?.profileImage;
    }
    return deed.seller?.profileImage;
  }

  const getDeedId = (deed) => {
    const id = deed.id || '';
    if (typeof id === 'string' && id.startsWith('#')) return id;
    const shortId = String(id).slice(-4).padStart(4, '0');
    return `#SCX-${shortId}`;
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden mt-6">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-100">
        <h2 className="text-base font-bold text-navy-900">{userType === 'seller' ? 'Your Orders' : 'My Deeds'}</h2>
        {onViewAllDeeds && (
          <button
            onClick={onViewAllDeeds}
            className="text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors"
          >
            View all {userType === 'seller' ? 'orders' : 'deeds'}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="px-6 pt-3 pb-0 flex gap-1 overflow-x-auto border-b border-neutral-100 hide-scrollbar">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`
              px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap mb-3
              ${activeFilter === tab.key
                ? (userType === 'seller' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-navy-900 text-white shadow-sm')
                : 'text-neutral-500 hover:bg-neutral-100 hover:text-navy-900'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Deeds List */}
      <div className="divide-y divide-neutral-100">
        {filteredDeeds.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-navy-900 mb-1">{userType === 'seller' ? 'No orders found' : 'No deeds found'}</p>
            <p className="text-xs text-neutral-400">
              {activeFilter === 'all' 
                ? (userType === 'seller' ? 'Accept order requests to start working with buyers.' : 'Create your first deed to get started.') 
                : `No ${filterTabs.find(t => t.key === activeFilter)?.label?.toLowerCase()} ${userType === 'seller' ? 'orders' : 'deeds'}.`}
            </p>
          </div>
        ) : (
          filteredDeeds.slice(0, 10).map((deed, index) => {
            const icon = getServiceIcon(index);
            const displayStatus = getDisplayStatus(deed, userType);
            const title = deed.title || deed.scopeBox?.title || 'Untitled Order';
            const amount = deed.amount || deed.scopeBox?.price || 0;
            const counterpartyName = getCounterpartyName(deed);
            const avatarUrl = getCounterpartyAvatar(deed);
            
            return (
              <div
                key={deed.id}
                onClick={() => handleDeedClick(deed)}
                className="px-6 py-4 flex items-center gap-4 hover:bg-neutral-50 transition-colors cursor-pointer group"
              >
                {/* Service Icon */}
                <div className={`w-10 h-10 rounded-xl ${userType === 'seller' ? 'bg-indigo-500' : icon.bg} flex items-center justify-center text-white text-sm flex-shrink-0`}>
                  {userType === 'seller' ? '💼' : icon.icon}
                </div>

                {/* Title & Deed ID */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-900 truncate">{title}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Order ID: {getDeedId(deed)}</p>
                </div>

                {/* Counterparty */}
                <div className="hidden md:flex items-center gap-2 min-w-[120px]">
                  <div className="text-right w-full">
                    <p className="text-[10px] text-neutral-400">{userType === 'seller' ? 'Buyer' : 'Seller'}</p>
                    <div className="flex items-center justify-end gap-1.5">
                      <p className="text-xs font-medium text-neutral-700 truncate max-w-[90px]">{counterpartyName}</p>
                      <div className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-600 flex-shrink-0">
                        {avatarUrl ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}${avatarUrl}`}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          counterpartyName.charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="hidden sm:block text-right min-w-[80px]">
                  <p className="text-[10px] text-neutral-400">Amount</p>
                  <p className="text-sm font-semibold text-navy-900">
                    {formatCurrency(amount, deed.currency || 'INR')}
                  </p>
                </div>

                {/* Status */}
                <div className="min-w-[100px] text-right">
                  <p className="text-[10px] text-neutral-400 mb-0.5 hidden sm:block">Status</p>
                  <StatusBadge status={displayStatus} />
                </div>

                {/* Arrow */}
                <ChevronRight
                  size={16}
                  className={`text-neutral-300 transition-colors flex-shrink-0 ${userType === 'seller' ? 'group-hover:text-indigo-600' : 'group-hover:text-primary-500'}`}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(DeedsTable);
