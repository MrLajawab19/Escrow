import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCurrency } from '../context/CurrencyContext';

const TransactionHistory = ({ userId, refreshTrigger }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { formatCurrency } = useCurrency();
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    status: '',
  });

  const transactionsPerPage = 10;

  useEffect(() => {
    fetchTransactions();
  }, [userId, currentPage, filters, refreshTrigger]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        limit: transactionsPerPage,
        offset: (currentPage - 1) * transactionsPerPage,
      };

      if (filters.category) params.category = filters.category;
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;

      const response = await axios.get('/api/wallet/transactions', { params });
      setTransactions(response.data.data.transactions);
      setTotalTransactions(response.data.data.total);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalTransactions / transactionsPerPage);

  const getCategoryIcon = (category) => {
    const icons = {
      ESCROW_LOCK: '🔒',
      ESCROW_RELEASE: '🔓',
      WITHDRAWAL: '💸',
      REFUND: '↩️',
      TOP_UP: '➕',
      FEE: '⚙️',
    };
    return icons[category] || '💰';
  };

  const getCategoryColor = (category) => {
    const colors = {
      ESCROW_LOCK: 'bg-orange-100 text-orange-800',
      ESCROW_RELEASE: 'bg-green-100 text-green-800',
      WITHDRAWAL: 'bg-red-100 text-red-800',
      REFUND: 'bg-blue-100 text-blue-800',
      TOP_UP: 'bg-green-100 text-green-800',
      FEE: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      SUCCESS: 'text-green-600 bg-green-50',
      PENDING: 'text-yellow-600 bg-yellow-50',
      FAILED: 'text-red-600 bg-red-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-gray-50 p-4 rounded-lg">
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="">All Categories</option>
          <option value="ESCROW_LOCK">Escrow Lock</option>
          <option value="ESCROW_RELEASE">Escrow Release</option>
          <option value="WITHDRAWAL">Withdrawal</option>
          <option value="REFUND">Refund</option>
          <option value="TOP_UP">Top Up</option>
          <option value="FEE">Fee</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="">All Types</option>
          <option value="CREDIT">Credit (In)</option>
          <option value="DEBIT">Debit (Out)</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="">All Status</option>
          <option value="SUCCESS">Successful</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>

        <button
          onClick={() => {
            setFilters({ category: '', type: '', status: '' });
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
        >
          Clear Filters
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Transactions Table */}
      {transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Fee</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Net Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full font-semibold ${
                      transaction.type === 'CREDIT'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'CREDIT' ? '↓ IN' : '↑ OUT'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(transaction.category)}`}>
                      {getCategoryIcon(transaction.category)} {transaction.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(transaction.amount || 0, transaction.currency || 'INR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600">
                    {transaction.fee > 0 ? formatCurrency(transaction.fee, transaction.currency || 'INR') : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-semibold">
                    <span className={transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.type === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.netAmount || 0, transaction.currency || 'INR')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(transaction.createdAt).toLocaleDateString()} {new Date(transaction.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-2">No transactions found</p>
          <p className="text-sm text-gray-500">Start by adding funds or making your first transaction</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * transactionsPerPage + 1} to{' '}
            {Math.min(currentPage * transactionsPerPage, totalTransactions)} of {totalTransactions} transactions
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg transition ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
