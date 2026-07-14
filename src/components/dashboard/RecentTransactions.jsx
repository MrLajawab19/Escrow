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
        params: { limit: 3, offset: 0 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data.data?.transactions || []);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    if (type === 'CREDIT') {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={16} className="text-emerald-500" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
        <ArrowUpRight size={16} className="text-red-500" />
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
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden mt-4">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-navy-900">Recent Transactions</h3>
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
            <p className="text-xs text-neutral-400">No transactions yet</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3">
              {getIcon(tx.type)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-navy-900 truncate">{tx.description || 'Transaction'}</p>
                <p className="text-[10px] text-neutral-400">{formatDate(tx.createdAt)}</p>
              </div>
              <p
                className={`text-xs font-bold flex-shrink-0 ${
                  tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {tx.type === 'CREDIT' ? '+' : '-'}
                {formatCurrency(tx.amount || 0, tx.currency || 'INR')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
