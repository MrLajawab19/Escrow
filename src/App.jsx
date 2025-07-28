import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import NewOrderPage from './pages/NewOrderPage';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">EscrowX</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link 
                  to="/buyer" 
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  Buyer Dashboard
                </Link>
                <Link 
                  to="/seller" 
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  Seller Dashboard
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/buyer" element={<BuyerDashboard />} />
          <Route path="/buyer/new-order" element={<NewOrderPage />} />
          <Route path="/seller" element={<SellerDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

// Home Page Component
const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="text-6xl mb-6">🏦</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to EscrowX</h1>
        <p className="text-gray-600 mb-8">
          Secure escrow platform for freelance and digital product transactions
        </p>
        <div className="space-y-4">
          <Link 
            to="/buyer"
            className="block w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Buyer Dashboard
          </Link>
          <Link 
            to="/seller"
            className="block w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Go to Seller Dashboard
          </Link>
        </div>
        
        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-3">🚨</div>
            <h3 className="font-semibold text-gray-900 mb-2">Dispute Resolution</h3>
            <p className="text-sm text-gray-600">
              Raise disputes and track resolution with evidence upload
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="font-semibold text-gray-900 mb-2">Secure Escrow</h3>
            <p className="text-sm text-gray-600">
              Funds held securely until both parties are satisfied
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-semibold text-gray-900 mb-2">Order Tracking</h3>
            <p className="text-sm text-gray-600">
              Real-time order status updates and timeline tracking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App; 