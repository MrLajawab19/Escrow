import axios from 'axios';

// Set base URL for API calls from env (fallback to 3001 where backend runs)
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
    if (error.response?.status === 401) {
      // Clear invalid tokens
      localStorage.removeItem('buyerToken');
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('buyerData');
      localStorage.removeItem('sellerData');
      // Redirect to home page
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axios;
