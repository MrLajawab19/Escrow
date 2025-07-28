import React, { useState, useEffect } from 'react';
import OrderCard from '../components/OrderCard';
import axios from 'axios';
import { Link } from 'react-router-dom';

const BuyerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewOrder, setShowNewOrder] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - replace with actual API call
      const mockOrders = [
        {
          id: 'order-123',
          buyerId: 'buyer-123',
          sellerId: 'seller-456',
          scopeBox: {
            title: 'Logo Design Project',
            description: 'Create a modern logo for tech startup',
            deliverables: ['Logo in PNG', 'Logo in SVG', 'Brand guidelines'],
            deadline: '2024-02-15T00:00:00.000Z',
            price: 500
          },
          status: 'SUBMITTED',
          deliveryFiles: [],
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-20T00:00:00.000Z',
          orderLogs: []
        },
        {
          id: 'order-124',
          buyerId: 'buyer-123',
          sellerId: 'seller-789',
          scopeBox: {
            title: 'Website Development',
            description: 'Build a responsive website with modern design',
            deliverables: ['HTML/CSS', 'JavaScript', 'Responsive design'],
            deadline: '2024-03-01T00:00:00.000Z',
            price: 1200
          },
          status: 'IN_PROGRESS',
          deliveryFiles: [],
          createdAt: '2024-01-10T00:00:00.000Z',
          updatedAt: '2024-01-10T00:00:00.000Z',
          orderLogs: []
        },
        {
          id: 'order-125',
          buyerId: 'buyer-123',
          sellerId: 'seller-101',
          scopeBox: {
            title: 'Mobile App Design',
            description: 'Design UI/UX for mobile application',
            deliverables: ['Wireframes', 'Mockups', 'Prototype'],
            deadline: '2024-02-28T00:00:00.000Z',
            price: 800
          },
          status: 'DISPUTED',
          deliveryFiles: [],
          createdAt: '2024-01-05T00:00:00.000Z',
          updatedAt: '2024-01-18T00:00:00.000Z',
          orderLogs: []
        }
      ];

      setOrders(mockOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderUpdate = (updatedOrder) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Buyer Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, Buyer</span>
              <Link
                to="/buyer/new-order"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + New Order
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-lg">📤</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {orders.filter(order => order.status === 'SUBMITTED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-lg">🚨</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Disputes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {orders.filter(order => order.status === 'DISPUTED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-lg">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {orders.filter(order => order.status === 'RELEASED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Your Orders</h2>
            </div>
          </div>
          <div className="p-6">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-500 mb-6">Start by creating your first order</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Create Order
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    userType="buyer"
                    onOrderUpdate={handleOrderUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard; 