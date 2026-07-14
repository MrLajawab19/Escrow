import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';

const LedgerTimeline = ({ transactions, loading }) => {
  const { formatCurrency } = useCurrency();

  if (loading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-navy-900 mb-6">Recent Ledger</h3>
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-neutral-200 rounded"></div>
                <div className="h-3 w-1/4 bg-neutral-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Take only top 5 for timeline
  const recentTransactions = transactions.slice(0, 5);

  const getTimelineIcon = (category) => {
    switch(category) {
      case 'ESCROW_LOCK': return '🔒';
      case 'ESCROW_RELEASE': return '🔓';
      case 'WITHDRAWAL': return '↗️';
      case 'REFUND': return '↩️';
      case 'TOP_UP': return '➕';
      case 'FEE': return '⚡';
      default: return '💰';
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm h-full">
      <h3 className="text-lg font-bold text-navy-900 mb-6">Recent Ledger</h3>
      
      {recentTransactions.length > 0 ? (
        <div className="relative pl-4 border-l border-neutral-100 space-y-6">
          {recentTransactions.map((t, idx) => (
            <div key={t.id} className="relative">
              {/* Timeline Dot/Icon */}
              <div className="absolute -left-8 w-8 h-8 bg-white border border-neutral-200 rounded-full flex items-center justify-center text-sm shadow-sm z-10">
                {getTimelineIcon(t.category)}
              </div>
              
              {/* Content */}
              <div className="pl-4">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-bold text-navy-900">{t.description}</p>
                  <p className={`text-sm font-bold ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-navy-900'}`}>
                    {t.type === 'CREDIT' ? '+' : '-'}{formatCurrency(t.netAmount || 0, t.currency || 'INR')}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{new Date(t.createdAt).toLocaleDateString()} at {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${t.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-600'}`}>
                    {t.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-neutral-500">No recent ledger activity.</p>
        </div>
      )}
      
      {transactions.length > 5 && (
        <button className="w-full mt-6 py-2 text-sm font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors">
          View Full Ledger
        </button>
      )}
    </div>
  );
};

export default LedgerTimeline;
