import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCurrency } from '../../context/CurrencyContext';
import { CheckCircle2, XCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

const RecentTransactions = ({ userId, onViewAll }) => {
  const { formatCurrency } = useCurrency();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('buyerToken');
      if (!token) return;
      const res = await axios.get('/api/wallet/transactions', {
        // Only show settled transactions in the dashboard summary widget.
        // INITIATED transactions (payment started but not confirmed) are not
        // "real" activity — showing them as credits is a trust-breaking display
        // bug. The full Wallet & Ledger page fetches without this filter so
        // INITIATED items appear there with a clear status badge.
        params: { limit: 3, offset: 0, status: 'SUCCESS' },
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data.data?.transactions || []);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };


  const getIcon = (tx) => {
    const isCredit = tx.type === 'CREDIT';
    if (isCredit) {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
        <ArrowUpRight size={16} className="text-red-500 dark:text-red-400" />
      </div>
    );
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
      ', ' +
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden mt-4">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-navy-900 dark:text-dark-primary">Recent Transactions</h3>
        <button
          onClick={onViewAll}
          className="text-[10px] font-semibold text-primary-500 hover:text-primary-600 transition-colors"
        >
          View all
        </button>
      </div>

      {/* Transactions List */}
      <div className="px-5 pb-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-neutral-400 dark:text-dark-muted">No transactions yet</p>
          </div>
        ) : (
          transactions.map((tx) => {
            const isCredit = tx.type === 'CREDIT';
            const displayAmount = Math.abs(tx.netAmount ?? tx.amount ?? 0);
            return (
              <div key={tx.id} className="flex items-center gap-3">
                {getIcon(tx)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-navy-900 dark:text-dark-primary truncate">{tx.description || 'Transaction'}</p>
                  <p className="text-[10px] text-neutral-400 dark:text-dark-muted">{formatDate(tx.createdAt)}</p>
                </div>
                <p
                  className={`text-xs font-bold flex-shrink-0 ${
                    isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {isCredit ? '+' : '-'}
                  {formatCurrency(displayAmount, tx.currency || 'INR')}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
