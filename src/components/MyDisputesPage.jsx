import React, { useState, useEffect } from 'react';
import OrderCard from './OrderCard';
import DisputeTracker from './DisputeTracker';
import axios from 'axios';

const MyDisputesPage = ({ userType, onClose }) => {
  const [disputedOrders, setDisputedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);

  useEffect(() => {
    fetchDisputedOrders();
  }, [userType]);

  const fetchDisputedOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = userType === 'buyer'
        ? localStorage.getItem('buyerToken')
        : localStorage.getItem('sellerToken');

      if (!token) {
        setError('Authentication required');
        return;
      }

      // Fetch all orders first, then filter for disputes
      const response = await axios.get(`/api/orders/${userType}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Filter orders that have disputes
        const orders = response.data.data;
        const disputedOrders = orders.filter(order =>
          order.status === 'DISPUTED' || order.disputeId
        );

        setDisputedOrders(disputedOrders);
      } else {
        setError(response.data.message || 'Failed to load disputed orders');
      }
    } catch (err) {
      console.error('Error fetching disputed orders:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please login again.');
      } else {
        setError('Failed to load disputed orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOrderUpdate = (updatedOrder) => {
    setDisputedOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-white rounded-xl shadow-elevation p-8 max-w-sm mx-4 w-full">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-500 font-medium">Loading your disputes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-white rounded-xl shadow-elevation p-8 max-w-sm mx-4 w-full">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-2">Error</h3>
            <p className="text-neutral-600 mb-6 text-sm leading-relaxed">{error}</p>
            <button
              onClick={fetchDisputedOrders}
              className="btn btn-primary w-full"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-elevation w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-neutral-200">
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-navy-900 tracking-tight">Active Disputes</h1>
            {disputedOrders.length > 0 && (
              <span className="ml-3 px-2.5 py-0.5 bg-red-100 text-red-700 rounded-md text-xs font-bold border border-red-200 tracking-wide">
                {disputedOrders.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-neutral-50/30">
          {disputedOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-neutral-200 border-dashed max-w-lg mx-auto">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">No active disputes</h3>
              <p className="text-neutral-500 mb-8 leading-relaxed max-w-sm mx-auto">
                Great! All your orders are progressing smoothly. You have no active disputes at the moment.
              </p>
              <button
                onClick={onClose}
                className="btn btn-outline border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {disputedOrders.map(order => (
                <div key={order.id} className="border border-red-200 rounded-xl p-1 bg-gradient-to-r from-red-50 to-white shadow-sm overflow-hidden">
                  <div className="bg-red-50 px-5 py-3 border-b border-red-100 flex justify-between items-center rounded-t-lg">
                    <span className="text-sm font-bold text-red-800 flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Requires Attention
                    </span>
                    <span className="text-xs font-medium text-red-600 uppercase tracking-wider">
                      Dispute #{order.disputeId?.slice(0, 8) || order.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="bg-white rounded-b-lg">
                    <OrderCard
                      order={order}
                      userType={userType}
                      onOrderUpdate={handleOrderUpdate}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="text-sm text-neutral-500 font-medium hidden sm:block">
            Showing {disputedOrders.length} disputed order{disputedOrders.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline border-neutral-300 text-neutral-700 hover:bg-neutral-100 bg-white ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyDisputesPage; 