import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { useCurrency } from '../../context/CurrencyContext';
import { ChevronRight } from 'lucide-react';

const BUYER_ACCEPTED_GRACE_MS = 60 * 60 * 1000;

function sellerAcceptedAtMs(order) {
  if (order.sellerAcceptedAt) return new Date(order.sellerAcceptedAt).getTime();
  const log = [...(order.orderLogs || [])].reverse().find((l) => l.event === 'ORDER_ACCEPTED');
  return log?.timestamp ? new Date(log.timestamp).getTime() : 0;
}

function getBuyerFacingStatus(order) {
  const st = order.status;
  if (st !== 'IN_PROGRESS') return st;
  const at = sellerAcceptedAtMs(order);
  if (at && Date.now() - at < BUYER_ACCEPTED_GRACE_MS) return 'ACCEPTED';
  return 'IN_PROGRESS';
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

function filterOrders(orders, filterKey) {
  switch (filterKey) {
    case 'in_progress':
      return orders.filter(o => ['IN_PROGRESS', 'ESCROW_FUNDED', 'ACCEPTED'].includes(o.status));
    case 'pending_review':
      return orders.filter(o => o.status === 'SUBMITTED');
    case 'completed':
      return orders.filter(o => o.status === 'RELEASED');
    case 'disputed':
      return orders.filter(o => o.status === 'DISPUTED');
    case 'cancelled':
      return orders.filter(o => ['CANCELLED', 'REFUNDED'].includes(o.status));
    default:
      return orders;
  }
}

const OrdersTable = ({ orders, onViewAllOrders }) => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredOrders = useMemo(
    () => filterOrders(orders, activeFilter),
    [orders, activeFilter]
  );

  const handleOrderClick = (order) => {
    const orderId = order.orderId || order.id;
    navigate(`/buyer/order/${orderId}`);
  };

  const getSellerName = (order) => {
    if (order.seller) return `${order.seller.firstName || ''} ${order.seller.lastName || ''}`.trim();
    if (order.sellerName) return order.sellerName;
    return 'Seller';
  };

  const getOrderId = (order) => {
    const id = order.orderId || order.id || '';
    if (typeof id === 'string' && id.startsWith('#')) return id;
    const shortId = String(id).slice(-4).padStart(4, '0');
    return `#SCX-${shortId}`;
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden mt-6">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-100">
        <h2 className="text-base font-bold text-navy-900">My Orders</h2>
        <button
          onClick={onViewAllOrders}
          className="text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors"
        >
          View all orders
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 pt-3 pb-0 flex gap-1 overflow-x-auto border-b border-neutral-100">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`
              px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap mb-3
              ${activeFilter === tab.key
                ? 'bg-navy-900 text-white shadow-sm'
                : 'text-neutral-500 hover:bg-neutral-100 hover:text-navy-900'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="divide-y divide-neutral-100">
        {filteredOrders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-navy-900 mb-1">No orders found</p>
            <p className="text-xs text-neutral-400">
              {activeFilter === 'all' ? 'Create your first order to get started.' : `No ${filterTabs.find(t => t.key === activeFilter)?.label?.toLowerCase()} orders.`}
            </p>
          </div>
        ) : (
          filteredOrders.slice(0, 5).map((order, index) => {
            const icon = getServiceIcon(index);
            const displayStatus = getBuyerFacingStatus(order);
            return (
              <div
                key={order.id}
                onClick={() => handleOrderClick(order)}
                className="px-6 py-4 flex items-center gap-4 hover:bg-neutral-50 transition-colors cursor-pointer group"
              >
                {/* Service Icon */}
                <div className={`w-10 h-10 rounded-xl ${icon.bg} flex items-center justify-center text-white text-sm flex-shrink-0`}>
                  {icon.icon}
                </div>

                {/* Title & Order ID */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-900 truncate">{order.title || 'Untitled Order'}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Order ID: {getOrderId(order)}</p>
                </div>

                {/* Seller */}
                <div className="hidden md:flex items-center gap-2 min-w-[120px]">
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-400">Seller</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-600">
                        {order.seller?.profileImage ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}${order.seller.profileImage}`}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getSellerName(order).charAt(0)
                        )}
                      </div>
                      <p className="text-xs font-medium text-neutral-700 truncate max-w-[90px]">{getSellerName(order)}</p>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="hidden sm:block text-right min-w-[80px]">
                  <p className="text-[10px] text-neutral-400">Amount</p>
                  <p className="text-sm font-semibold text-navy-900">
                    {formatCurrency(order.amount || order.totalAmount || 0, order.currency || 'INR')}
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
                  className="text-neutral-300 group-hover:text-primary-500 transition-colors flex-shrink-0"
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OrdersTable;
