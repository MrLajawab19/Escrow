import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import BuyerAuth from './pages/BuyerAuth';
import SellerAuth from './pages/SellerAuth';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import NewOrderPage from './pages/NewOrderPage';
import OrderTrackingPage from './pages/OrderTrackingPage';

function App() {
  const [isBuyerAuthenticated, setIsBuyerAuthenticated] = useState(false);
  const [isSellerAuthenticated, setIsSellerAuthenticated] = useState(false);
  const [buyerData, setBuyerData] = useState(null);
  const [sellerData, setSellerData] = useState(null);

  useEffect(() => {
    // Check authentication status on component mount
    const checkAuth = () => {
      // Check buyer auth
      const buyerToken = localStorage.getItem('buyerToken');
      const buyerData = localStorage.getItem('buyerData');
      
      if (buyerToken && buyerData) {
        setIsBuyerAuthenticated(true);
        setBuyerData(JSON.parse(buyerData));
      } else {
        setIsBuyerAuthenticated(false);
        setBuyerData(null);
      }

      // Check seller auth
      const sellerToken = localStorage.getItem('sellerToken');
      const sellerData = localStorage.getItem('sellerData');
      
      if (sellerToken && sellerData) {
        setIsSellerAuthenticated(true);
        setSellerData(JSON.parse(sellerData));
      } else {
        setIsSellerAuthenticated(false);
        setSellerData(null);
      }
    };

    // Check auth on mount
    checkAuth();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'buyerToken' || e.key === 'buyerData' || 
          e.key === 'sellerToken' || e.key === 'sellerData') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleBuyerLogout = () => {
    localStorage.removeItem('buyerToken');
    localStorage.removeItem('buyerData');
    setIsBuyerAuthenticated(false);
    setBuyerData(null);
    // Redirect to home page
    window.location.href = '/';
  };

  const handleSellerLogout = () => {
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerData');
    setIsSellerAuthenticated(false);
    setSellerData(null);
    // Redirect to home page
    window.location.href = '/';
  };

  return (
    <Router>
      <div className="App">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="text-xl font-bold text-gray-900">
                  EscrowX
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                {isBuyerAuthenticated ? (
                  <>
                    <Link 
                      to="/buyer/dashboard" 
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                    >
                      Buyer Dashboard
                    </Link>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        Welcome, {buyerData?.firstName || 'Buyer'}
                      </span>
                      <button
                        onClick={handleBuyerLogout}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : isSellerAuthenticated ? (
                  <>
                    <Link 
                      to="/seller/dashboard" 
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                    >
                      Seller Dashboard
                    </Link>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        Welcome, {sellerData?.firstName || 'Seller'}
                      </span>
                      <button
                        onClick={handleSellerLogout}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/buyer/auth" 
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                    >
                      Buyer Login
                    </Link>
                    <Link 
                      to="/seller/auth" 
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                    >
                      Seller Login
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/buyer/auth" element={<BuyerAuth />} />
          <Route path="/seller/auth" element={<SellerAuth />} />
          <Route path="/buyer/dashboard" element={<ProtectedBuyerRoute><BuyerDashboard /></ProtectedBuyerRoute>} />
          <Route path="/buyer/new-order" element={<ProtectedBuyerRoute><NewOrderPage /></ProtectedBuyerRoute>} />
          <Route path="/buyer/order/:orderId" element={<ProtectedBuyerRoute><OrderTrackingPage /></ProtectedBuyerRoute>} />
          <Route path="/seller/dashboard" element={<ProtectedSellerRoute><SellerDashboard /></ProtectedSellerRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

// Protected Route Components
const ProtectedBuyerRoute = ({ children }) => {
  const buyerToken = localStorage.getItem('buyerToken');
  const buyerData = localStorage.getItem('buyerData');

  if (!buyerToken || !buyerData) {
    return <Navigate to="/buyer/auth" replace />;
  }

  return children;
};

const ProtectedSellerRoute = ({ children }) => {
  const sellerToken = localStorage.getItem('sellerToken');
  const sellerData = localStorage.getItem('sellerData');

  if (!sellerToken || !sellerData) {
    return <Navigate to="/seller/auth" replace />;
  }

  return children;
};

// Home Page Component
const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="text-6xl mb-6">🏦</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Welcome to EscrowX</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Secure escrow platform for freelance and digital product transactions. 
            Protect your payments and ensure fair delivery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/buyer/auth"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started as Buyer
            </Link>
            <Link 
              to="/seller/auth"
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Join as Seller
            </Link>
          </div>
        </div>
        
        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🚨</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Dispute Resolution</h3>
            <p className="text-gray-600">
              Raise disputes and track resolution with evidence upload. 
              Our system ensures fair resolution for all parties.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Escrow</h3>
            <p className="text-gray-600">
              Funds held securely until both parties are satisfied. 
              No more payment disputes or delivery issues.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Order Tracking</h3>
            <p className="text-gray-600">
              Real-time order status updates and timeline tracking. 
              Stay informed throughout the entire process.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Create Order</h4>
              <p className="text-sm text-gray-600">Buyer creates an order with detailed requirements</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Fund Escrow</h4>
              <p className="text-sm text-gray-600">Payment is held securely in escrow</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Work & Deliver</h4>
              <p className="text-sm text-gray-600">Seller completes work and submits delivery</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">4</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Release Funds</h4>
              <p className="text-sm text-gray-600">Buyer approves and funds are released</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App; 