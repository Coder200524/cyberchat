import axios from 'axios';

// Add debug log as requested
console.log("VITE_API_URL loaded as:", import.meta.env.VITE_API_URL);

// Create an Axios instance
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 30000, // 30 second default timeout for regular requests
});

// Add a request interceptor to attach the JWT token and adjust timeout for uploads
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Increase timeout for file uploads (5 minutes)
    if (config.url && config.url.includes('/upload')) {
      config.timeout = 5 * 60 * 1000; // 5 minutes for file uploads
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
