import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { ArrowDownLeft, ArrowUpRight, Search, Filter, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';

const TransactionRow = ({ transaction, formatCurrency }) => {
  const isCredit = transaction.type === 'CREDIT';
  
  const getCategoryIcon = (category) => {
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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'SUCCESS': return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">Success</span>;
      case 'PENDING': return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100">Pending</span>;
      case 'FAILED': return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100">Failed</span>;
      default: return <span className="px-2.5 py-1 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-lg border border-neutral-200">{status}</span>;
    }
  };

  return (
    <tr className="border-b border-neutral-100 last:border-none hover:bg-neutral-50/50 transition-colors group">
      {/* Icon & Description */}
      <td className="py-4 pl-6">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-600'}`}>
            {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
          </div>
          <div>
            <p className="text-sm font-bold text-navy-900 group-hover:text-primary-600 transition-colors">
              {transaction.description}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Ref: {transaction.id.substring(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
      </td>
      
      {/* Category */}
      <td className="py-4 px-4 text-sm">
        <div className="flex items-center gap-1.5 text-neutral-600">
          <span className="text-base">{getCategoryIcon(transaction.category)}</span>
          <span className="font-medium text-xs">{transaction.category.replace(/_/g, ' ')}</span>
        </div>
      </td>

      {/* Date & Time */}
      <td className="py-4 px-4">
        <p className="text-sm font-semibold text-navy-900">
          {new Date(transaction.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <p className="text-xs text-neutral-500 mt-0.5">
          {new Date(transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </td>

      {/* Amount & Fee */}
      <td className="py-4 px-4 text-right">
        <p className={`text-sm font-black ${isCredit ? 'text-emerald-600' : 'text-navy-900'}`}>
          {isCredit ? '+' : '-'}{formatCurrency(transaction.netAmount || 0, transaction.currency || 'INR')}
        </p>
        {transaction.fee > 0 && (
          <p className="text-xs text-neutral-500 mt-0.5">
            Fee: {formatCurrency(transaction.fee, transaction.currency || 'INR')}
          </p>
        )}
      </td>

      {/* Status */}
      <td className="py-4 pr-6 text-right">
        <div className="flex items-center justify-end gap-3">
          {getStatusBadge(transaction.status)}
          <button className="text-neutral-400 hover:text-navy-900 transition-colors p-1 rounded-md hover:bg-neutral-100 opacity-0 group-hover:opacity-100">
            <MoreVertical size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const TransactionTable = ({ 
  transactions, 
  loading, 
  error, 
  filters, 
  onFilterChange, 
  currentPage, 
  totalPages, 
  onPageChange,
  totalTransactions 
}) => {
  const { formatCurrency } = useCurrency();

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Header & Filters */}
      <div className="p-5 border-b border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-50/30">
        <div>
          <h3 className="text-lg font-bold text-navy-900">Recent Transactions</h3>
          <p className="text-sm text-neutral-500">{totalTransactions} total activities</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filters */}
          <div className="flex bg-neutral-100 p-1 rounded-xl">
            <button 
              onClick={() => onFilterChange('category', '')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${!filters.category ? 'bg-white text-navy-900 shadow-sm' : 'text-neutral-500 hover:text-navy-900'}`}
            >
              All
            </button>
            <button 
              onClick={() => onFilterChange('category', 'TOP_UP')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filters.category === 'TOP_UP' ? 'bg-white text-navy-900 shadow-sm' : 'text-neutral-500 hover:text-navy-900'}`}
            >
              Credits
            </button>
            <button 
              onClick={() => onFilterChange('category', 'WITHDRAWAL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filters.category === 'WITHDRAWAL' ? 'bg-white text-navy-900 shadow-sm' : 'text-neutral-500 hover:text-navy-900'}`}
            >
              Debits
            </button>
            <button 
              onClick={() => onFilterChange('category', 'ESCROW_LOCK')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filters.category === 'ESCROW_LOCK' ? 'bg-white text-navy-900 shadow-sm' : 'text-neutral-500 hover:text-navy-900'}`}
            >
              Escrow
            </button>
          </div>
          
          {/* Detailed Filters (Disabled visually for aesthetics, backed by API) */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 rounded-xl text-xs font-bold text-navy-900 hover:bg-neutral-50 transition-colors">
            <Filter size={14} /> Filters
          </button>
        </div>
      </div>

      {error && (
        <div className="m-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left">
          <thead>
            <tr className="bg-neutral-50/50 border-b border-neutral-200 text-xs font-bold text-neutral-500 uppercase tracking-wider">
              <th className="py-3 pl-6 pr-4">Transaction</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 pr-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-neutral-100">
                  <td className="py-4 pl-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-neutral-200 animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse"></div>
                        <div className="h-3 w-20 bg-neutral-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4"><div className="h-4 w-24 bg-neutral-200 rounded animate-pulse"></div></td>
                  <td className="py-4 px-4"><div className="h-4 w-24 bg-neutral-200 rounded animate-pulse"></div></td>
                  <td className="py-4 px-4"><div className="h-4 w-20 bg-neutral-200 rounded ml-auto animate-pulse"></div></td>
                  <td className="py-4 pr-6"><div className="h-6 w-16 bg-neutral-200 rounded-lg ml-auto animate-pulse"></div></td>
                </tr>
              ))
            ) : transactions.length > 0 ? (
              transactions.map(t => <TransactionRow key={t.id} transaction={t} formatCurrency={formatCurrency} />)
            ) : (
              <tr>
                <td colSpan="5">
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 mb-4">
                      <Search size={32} />
                    </div>
                    <p className="text-base font-bold text-navy-900 mb-1">No transactions found</p>
                    <p className="text-sm text-neutral-500">Try adjusting your filters or start using ScrowX.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="p-4 border-t border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <p className="text-xs font-semibold text-neutral-500">
            Showing Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-1.5">
            <button 
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 border border-neutral-200 rounded-lg text-navy-900 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-neutral-200 rounded-lg text-navy-900 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
