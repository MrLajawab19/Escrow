import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import BuyerAuth from './pages/BuyerAuth';
import SellerAuth from './pages/SellerAuth';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import NewOrderPage from './pages/NewOrderPage';
import OrderTrackingPage from './pages/OrderTrackingPage';

// Route Change Handler Component
const RouteChangeHandler = ({ children, onAuthClear, onCheckAuth }) => {
  const location = useLocation();
  
  useEffect(() => {
    // If navigating to homepage and user is authenticated, clear auth
    if (location.pathname === '/' && (localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken'))) {
      localStorage.removeItem('buyerToken');
      localStorage.removeItem('buyerData');
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('sellerData');
      // Update state to reflect logout
      onAuthClear();
    } else {
      // Check auth state on any route change
      onCheckAuth();
    }
  }, [location.pathname, onAuthClear, onCheckAuth]);
  
  return children;
};

// Home Page Component with Auto-Logout
const HomePage = ({ onAuthClear }) => {
  useEffect(() => {
    // Check if user is authenticated when homepage loads
    if (localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken')) {
      localStorage.removeItem('buyerToken');
      localStorage.removeItem('buyerData');
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('sellerData');
      onAuthClear();
    }
  }, [onAuthClear]);

  return (
    <div className="min-h-screen bg-gradient-tech relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl animate-pulse-glow"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16 animate-fade-in">
          <div className="text-6xl sm:text-8xl mb-6 animate-bounce-slow">🏦</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-inter font-black mb-6 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Welcome to EscrowX
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 max-w-3xl mx-auto px-4 text-white/90 font-inter font-medium">
            Secure escrow platform for freelance and digital product transactions. 
            Protect your payments and ensure fair delivery with cutting-edge technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Link 
              to="/buyer/auth"
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-inter font-semibold text-lg px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <span className="mr-2">🚀</span>
              Get Started as Buyer
            </Link>
            <Link 
              to="/seller/auth"
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-inter font-semibold text-lg px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <span className="mr-2">💼</span>
              Join as Seller
            </Link>
          </div>
        </div>
        
        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl animate-slide-up shadow-lg">
            <div className="text-4xl sm:text-5xl mb-6 animate-bounce-slow">🚨</div>
            <h3 className="text-xl sm:text-2xl font-inter font-bold mb-4 text-white">Dispute Resolution</h3>
            <p className="text-white/80 font-inter">
              Raise disputes and track resolution with evidence upload. 
              Our AI-powered system ensures fair resolution for all parties.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl animate-slide-up shadow-lg" style={{animationDelay: '0.1s'}}>
            <div className="text-4xl sm:text-5xl mb-6 animate-bounce-slow">💰</div>
            <h3 className="text-xl sm:text-2xl font-inter font-bold mb-4 text-white">Secure Escrow</h3>
            <p className="text-white/80 font-inter">
              Funds held securely with blockchain-level encryption until both parties are satisfied. 
              No more payment disputes or delivery issues.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl animate-slide-up sm:col-span-2 lg:col-span-1 shadow-lg" style={{animationDelay: '0.2s'}}>
            <div className="text-4xl sm:text-5xl mb-6 animate-bounce-slow">📋</div>
            <h3 className="text-xl sm:text-2xl font-inter font-bold mb-4 text-white">Order Tracking</h3>
            <p className="text-white/80 font-inter">
              Real-time order status updates and timeline tracking with advanced analytics. 
              Stay informed throughout the entire process.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 lg:p-12 transition-all duration-300 hover:shadow-xl animate-slide-up shadow-lg" style={{animationDelay: '0.3s'}}>
          <h2 className="text-3xl sm:text-4xl font-inter font-black mb-8 text-center bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { step: '1', title: 'Create Order', desc: 'Buyer creates an order with detailed requirements', icon: '📝' },
              { step: '2', title: 'Fund Escrow', desc: 'Payment is held securely in escrow', icon: '🔒' },
              { step: '3', title: 'Work & Deliver', desc: 'Seller completes work and submits delivery', icon: '⚡' },
              { step: '4', title: 'Release Funds', desc: 'Buyer approves and funds are released', icon: '✅' }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <h4 className="font-inter font-bold mb-3 text-white text-lg">{item.title}</h4>
                <p className="text-white/70 font-inter text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [isBuyerAuthenticated, setIsBuyerAuthenticated] = useState(false);
  const [isSellerAuthenticated, setIsSellerAuthenticated] = useState(false);
  const [buyerData, setBuyerData] = useState(null);
  const [sellerData, setSellerData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  useEffect(() => {
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

  const clearAuthState = () => {
    setIsBuyerAuthenticated(false);
    setIsSellerAuthenticated(false);
    setBuyerData(null);
    setSellerData(null);
    setIsMobileMenuOpen(false);
  };

  const handleHomeClick = () => {
    // Clear authentication when navigating to home
    localStorage.removeItem('buyerToken');
    localStorage.removeItem('buyerData');
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerData');
    clearAuthState();
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('nav')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <Router>
      <div className="App">
        {/* Navigation */}
        <nav className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-white/20 sticky top-0 z-50 backdrop-blur-xl shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link 
                  to="/" 
                  className="text-2xl font-inter font-black transition-all duration-300 hover:opacity-80 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent" 
                  onClick={handleHomeClick}
                >
                  EscrowX
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-6">
                {isBuyerAuthenticated ? (
                  <>
                    <Link 
                      to="/buyer/dashboard" 
                      className="px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/10 font-inter font-medium text-white hover:shadow-glow"
                    >
                      Buyer Dashboard
                    </Link>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-white/80 font-inter">
                        Welcome, {buyerData?.firstName || 'Buyer'}
                      </span>
                      <button
                        onClick={handleBuyerLogout}
                        className="px-4 py-2 text-sm rounded-xl transition-all duration-300 hover:bg-red-500/20 text-red-400 font-inter font-medium"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : isSellerAuthenticated ? (
                  <>
                    <Link 
                      to="/seller/dashboard" 
                      className="px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/10 font-inter font-medium text-white hover:shadow-glow"
                    >
                      Seller Dashboard
                    </Link>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-white/80 font-inter">
                        Welcome, {sellerData?.firstName || 'Seller'}
                      </span>
                      <button
                        onClick={handleSellerLogout}
                        className="px-4 py-2 text-sm rounded-xl transition-all duration-300 hover:bg-red-500/20 text-red-400 font-inter font-medium"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/buyer/auth" 
                      className="px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/10 font-inter font-medium text-white hover:shadow-glow"
                    >
                      Buyer Login
                    </Link>
                    <Link 
                      to="/seller/auth" 
                      className="px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/10 font-inter font-medium text-white hover:shadow-glow"
                    >
                      Seller Login
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-xl transition-all duration-300 hover:bg-white/10 text-white"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-white/20 animate-fade-in">
                <div className="flex flex-col space-y-3">
                  {isBuyerAuthenticated ? (
                    <>
                      <Link 
                        to="/buyer/dashboard" 
                        className="px-4 py-3 rounded-xl transition-all duration-300 hover:bg-white/10 font-inter font-medium text-white"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Buyer Dashboard
                      </Link>
                      <div className="px-4 py-2">
                        <span className="text-sm text-white/80 font-inter">
                          Welcome, {buyerData?.firstName || 'Buyer'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          handleBuyerLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="px-4 py-3 text-left text-sm rounded-xl transition-all duration-300 hover:bg-red-500/20 text-red-400 font-inter font-medium"
                      >
                        Logout
                      </button>
                    </>
                  ) : isSellerAuthenticated ? (
                    <>
                      <Link 
                        to="/seller/dashboard" 
                        className="px-4 py-3 rounded-xl transition-all duration-300 hover:bg-white/10 font-inter font-medium text-white"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Seller Dashboard
                      </Link>
                      <div className="px-4 py-2">
                        <span className="text-sm text-white/80 font-inter">
                          Welcome, {sellerData?.firstName || 'Seller'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          handleSellerLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="px-4 py-3 text-left text-sm rounded-xl transition-all duration-300 hover:bg-red-500/20 text-red-400 font-inter font-medium"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/buyer/auth" 
                        className="px-4 py-3 rounded-xl transition-all duration-300 hover:bg-white/10 font-inter font-medium text-white"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Buyer Login
                      </Link>
                      <Link 
                        to="/seller/auth" 
                        className="px-4 py-3 rounded-xl transition-all duration-300 hover:bg-white/10 font-inter font-medium text-white"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Seller Login
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Routes */}
        <RouteChangeHandler onAuthClear={clearAuthState} onCheckAuth={checkAuth}>
          <Routes>
            <Route path="/" element={<HomePage onAuthClear={clearAuthState} />} />
            <Route path="/buyer/auth" element={<BuyerAuth />} />
            <Route path="/seller/auth" element={<SellerAuth />} />
            <Route path="/buyer/dashboard" element={<ProtectedBuyerRoute><BuyerDashboard /></ProtectedBuyerRoute>} />
            <Route path="/buyer/new-order" element={<ProtectedBuyerRoute><NewOrderPage /></ProtectedBuyerRoute>} />
            <Route path="/buyer/order/:orderId" element={<ProtectedBuyerRoute><OrderTrackingPage /></ProtectedBuyerRoute>} />
            <Route path="/seller/dashboard" element={<ProtectedSellerRoute><SellerDashboard /></ProtectedSellerRoute>} />
          </Routes>
        </RouteChangeHandler>
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

export default App; 