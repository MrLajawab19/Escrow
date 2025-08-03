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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Loading your disputes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchDisputedOrders}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">🚨 My Disputes</h1>
            <span className="ml-3 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              {disputedOrders.length} {disputedOrders.length === 1 ? 'Dispute' : 'Disputes'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {disputedOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No disputes found</h3>
              <p className="text-gray-500 mb-6">
                Great! You don't have any active disputes at the moment.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {disputedOrders.map(order => (
                <div key={order.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <OrderCard
                    order={order}
                    userType={userType}
                    onOrderUpdate={handleOrderUpdate}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {disputedOrders.length} disputed order{disputedOrders.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDisputesPage; 