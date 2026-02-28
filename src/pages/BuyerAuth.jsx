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
    if (!validateForm()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (isLogin) {
        const response = await axios.post('/api/auth/buyer/login', {
          email: formData.email,
          password: formData.password
        }, { headers: { 'Content-Type': 'application/json' } });
        if (response.data.success) {
          localStorage.setItem('buyerToken', response.data.token);
          localStorage.setItem('buyerData', JSON.stringify(response.data.user));
          setSuccess('Login successful! Redirecting...');
          setTimeout(() => { window.location.href = '/buyer/dashboard'; }, 1500);
        }
      } else {
        const response = await axios.post('/api/auth/buyer/signup', {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          country: formData.country
        }, { headers: { 'Content-Type': 'application/json' } });
        if (response.data.success) {
          setSuccess('Account created successfully! Please log in.');
          setIsLogin(true);
          setFormData({ email: formData.email, password: '', confirmPassword: '', firstName: '', lastName: '', phone: '', country: '' });
        }
      }
    } catch (error) {
      const msg = error.response?.data?.message
        || (error.code === 'ERR_NETWORK' ? 'Cannot reach server. Is the backend running?' : null)
        || error.message
        || 'An error occurred. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', phone: '', country: '' });
  };

  const inputClass = "w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-[#0A2540] placeholder-neutral-400 font-inter text-sm shadow-sm";
  const labelClass = "block text-sm font-medium mb-1.5 text-[#0A2540] font-inter";

  return (
    <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center p-4 relative">
      {/* Top accent stripe */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-600" />

      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/Logo.png" alt="ScrowX Logo" className="mx-auto mb-3 h-12 w-auto" />
          <p className="text-xs font-semibold text-neutral-400 font-inter tracking-widest uppercase">Buyer Portal</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#0A2540] font-inter">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="mt-1 text-sm text-neutral-500 font-inter">
              {isLogin ? 'Sign in to your buyer account' : 'Join ScrowX as a buyer'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 border border-red-200 rounded-xl bg-red-50 text-red-600 text-sm font-inter flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 border border-green-200 rounded-xl bg-green-50 text-green-700 text-sm font-inter flex items-center gap-2">
              <span>✓</span> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>First Name *</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className={inputClass} placeholder="John" />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name *</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className={inputClass} placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={inputClass} placeholder="+1 (555) 123-4567" />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <select name="country" value={formData.country} onChange={handleInputChange} className={inputClass}>
                    <option value="">Select Country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="IN">India</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="JP">Japan</option>
                    <option value="BR">Brazil</option>
                    <option value="MX">Mexico</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>Email Address *</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass} placeholder="john@example.com" />
            </div>

            <div>
              <label className={labelClass}>Password *</label>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} className={inputClass} placeholder="••••••••" />
            </div>

            {!isLogin && (
              <div>
                <label className={labelClass}>Confirm Password *</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className={inputClass} placeholder="••••••••" />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-inter text-sm mt-1"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

          <div className="mt-5 text-center">
            <p className="text-sm text-neutral-500 font-inter">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button onClick={toggleMode} className="ml-1.5 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {isLogin && (
            <div className="mt-3 text-center">
              <button className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors font-inter">
                Forgot your password?
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-neutral-400 font-inter">
            By continuing, you agree to our{' '}
            <a href="#" className="text-indigo-600 hover:text-indigo-800 transition-colors">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-indigo-600 hover:text-indigo-800 transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BuyerAuth;