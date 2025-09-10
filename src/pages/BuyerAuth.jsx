import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BuyerAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return false;
    }

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (!formData.firstName || !formData.lastName) {
        setError('First name and last name are required');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        // Login
        console.log('Attempting login with:', { email: formData.email });
        console.log('Making request to:', '/api/auth/buyer/login');
        
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/buyer/login`, {
          email: formData.email,
          password: formData.password
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Login response status:', response.status);
        console.log('Login response data:', response.data);

        if (response.data.success) {
          // Store token and user data
          localStorage.setItem('buyerToken', response.data.token);
          localStorage.setItem('buyerData', JSON.stringify(response.data.user));
          setSuccess('Login successful! Redirecting...');
          
          // Force a page reload to update the navigation
          setTimeout(() => {
            window.location.href = '/buyer/dashboard';
          }, 1500);
        }
      } else {
        // Signup
        console.log('Attempting signup with:', { email: formData.email });
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/buyer/signup`, {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          country: formData.country
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Signup response:', response.data);

        if (response.data.success) {
          setSuccess('Account created successfully! Please log in.');
          setIsLogin(true);
          setFormData({
            email: formData.email,
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            phone: '',
            country: ''
          });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      console.error('Error config:', error.config);
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      country: ''
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-teal-900/20 to-transparent"></div>
        
        {/* Spotlight effect behind logo */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-teal-400/20 via-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse-glow"></div>
        
        {/* Floating background elements */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/4 right-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse-glow" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 relative">
          {/* Logo spotlight background */}
          <div className="absolute inset-0 flex justify-center items-start pt-2">
            <div className="w-40 h-40 sm:w-48 sm:h-48 bg-gradient-radial from-teal-400/35 via-cyan-400/25 to-transparent rounded-full blur-2xl animate-pulse-glow"></div>
          </div>
          <div className="relative z-10">
            <img 
              src="/Logo.png" 
              alt="ScrowX Logo" 
              className="mx-auto mb-6 h-24 sm:h-28 w-auto filter brightness-150 contrast-150 drop-shadow-2xl hover:scale-105 transition-all duration-300"
              style={{
                filter: 'brightness(1.5) contrast(1.5) drop-shadow(0 0 25px rgba(6, 182, 212, 0.6)) drop-shadow(0 0 50px rgba(6, 182, 212, 0.3)) drop-shadow(0 0 75px rgba(6, 182, 212, 0.1))'
              }}
            />
          </div>
          <p className="mt-2 text-white/80 font-inter">Buyer Portal</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:shadow-3xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white font-inter">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="mt-2 text-white/80 font-inter">
              {isLogin ? 'Sign in to your buyer account' : 'Join ScrowX as a buyer'}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 border border-red-500/20 rounded-xl bg-red-500/10 text-red-400 backdrop-blur-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 border border-emerald-500/20 rounded-xl bg-emerald-500/10 text-emerald-400 backdrop-blur-sm">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                                  <label className="block text-sm font-medium mb-1 text-white font-inter">
                First Name *
              </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white font-inter">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                                  <label className="block text-sm font-medium mb-1 text-white font-inter">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50"
                  placeholder="+1 (555) 123-4567"
                />
                </div>
                <div>
                                  <label className="block text-sm font-medium mb-1 text-white font-inter">
                  Country
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                >
                    <option value="" className="text-gray-900 bg-white">Select Country</option>
                    <option value="US" className="text-gray-900 bg-white">United States</option>
                    <option value="CA" className="text-gray-900 bg-white">Canada</option>
                    <option value="UK" className="text-gray-900 bg-white">United Kingdom</option>
                    <option value="IN" className="text-gray-900 bg-white">India</option>
                    <option value="AU" className="text-gray-900 bg-white">Australia</option>
                    <option value="DE" className="text-gray-900 bg-white">Germany</option>
                    <option value="FR" className="text-gray-900 bg-white">France</option>
                    <option value="JP" className="text-gray-900 bg-white">Japan</option>
                    <option value="BR" className="text-gray-900 bg-white">Brazil</option>
                    <option value="MX" className="text-gray-900 bg-white">Mexico</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-white font-inter">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-white font-inter">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1 text-white font-inter">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-white/80 font-inter">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={toggleMode}
                className="ml-2 font-medium transition-all duration-200 hover:underline text-cyan-400 hover:text-cyan-300"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Forgot Password */}
          {isLogin && (
            <div className="mt-4 text-center">
              <button className="text-sm transition-all duration-200 hover:underline text-white/80 font-inter">
                Forgot your password?
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-white/80 font-inter">
            By continuing, you agree to our{' '}
            <a href="#" className="transition-all duration-200 hover:underline text-cyan-400 hover:text-cyan-300">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="transition-all duration-200 hover:underline text-cyan-400 hover:text-cyan-300">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BuyerAuth; 