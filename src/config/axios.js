import axios from 'axios';

// In dev: always use proxy (empty base = same origin, Vite proxies /api to backend)
// In prod: use VITE_API_URL for the deployed API
axios.defaults.baseURL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3000');

// Add request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('buyerToken') || localStorage.getItem('sellerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 for authenticated requests (not login/signup)
    const isAuthEndpoint = error.config?.url?.includes('/auth/') && (error.config?.url?.includes('/login') || error.config?.url?.includes('/signup'));
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('buyerToken');
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('buyerData');
      localStorage.removeItem('sellerData');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axios;
