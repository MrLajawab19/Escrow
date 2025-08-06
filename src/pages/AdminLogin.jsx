import React, { useState } from 'react';
import axios from 'axios';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    email: 'admin@escrowx.com',
    password: 'admin123'
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
      const response = await axios.post('http://localhost:3000/api/auth/admin/login', credentials);
      
      if (response.data.success) {
        localStorage.setItem('adminToken', response.data.token);
        setSuccess('Admin login successful! Token saved.');
        console.log('Admin token:', response.data.token);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-lg">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent font-inter">Admin Panel</h1>
          <p className="mt-2 text-white/80 font-inter">EscrowX Administration</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:shadow-3xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white font-inter">
              Admin Login
            </h2>
            <p className="mt-2 text-white/80 font-inter">
              Test admin dashboard functionality
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white font-inter">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                placeholder="admin@escrowx.com"
                value={credentials.email}
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white font-inter">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg font-inter"
            >
              {loading ? 'Logging in...' : 'Sign in as Admin'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-white/60 font-inter">
            Default credentials: admin@escrowx.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 