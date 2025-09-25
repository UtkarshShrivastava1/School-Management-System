import axios from 'axios';

const API_URL = process.env.REACT_APP_NODE_ENV === "production"
  ? process.env.REACT_APP_PRODUCTION_URL
  : process.env.REACT_APP_DEVELOPMENT_URL;

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 