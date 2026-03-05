import React, { useState } from 'react';
import axios from 'axios';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: 'admin@scrowx.com',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/auth/admin/login', formData);

      if (response.data.success) {
        localStorage.setItem('adminToken', response.data.token);
        setSuccess('Login successful. Redirecting...');
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 800);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <img
            src="/Logo.png"
            alt="ScrowX Logo"
            className="mx-auto mb-5 h-14 w-auto"
          />
          <h1 className="text-2xl font-bold text-[#0A2540] font-inter tracking-tight">Admin Panel</h1>
          <p className="mt-1.5 text-sm text-neutral-500 font-inter">ScrowX Administration — Restricted Access</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#0A2540] font-inter">Sign in as Admin</h2>
            <p className="text-sm text-neutral-500 font-inter mt-1">Enter your administrator credentials to continue.</p>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="mb-4 p-3.5 border border-red-200 rounded-xl bg-red-50 text-red-700 text-sm font-inter flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3.5 border border-emerald-200 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-inter flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0A2540] mb-1.5 font-inter">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-[#0A2540] placeholder-neutral-400 font-inter text-sm shadow-sm transition-all"
                placeholder="admin@scrowx.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0A2540] mb-1.5 font-inter">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-[#0A2540] placeholder-neutral-400 font-inter text-sm shadow-sm transition-all"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 shadow-md font-inter text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in as Admin'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-neutral-100 text-center">
            <p className="text-xs text-neutral-400 font-inter">
              Default credentials: <span className="font-medium text-neutral-600">admin@scrowx.com</span> / <span className="font-medium text-neutral-600">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;