import axios from 'axios';
import Cookies from 'js-cookie';

// Use environment variable for API URL, fallback to localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  // Get token from localStorage (if we're in a browser environment)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
        }
      } catch (e) {
        console.warn('Failed to decode token for debugging:', e);
      }

      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors or handle them globally
    try {
      // Safely extract error information
      const errorMessage = error?.response?.data
        ? (typeof error.response.data === 'object'
            ? JSON.stringify(error.response.data)
            : error.response.data)
        : error?.message || 'Unknown error';

      console.error('API Error:', errorMessage);
    } catch (loggingError) {
      console.error('Error while logging API error:', loggingError);
    }

    // Handle 401 Unauthorized errors
    if (error?.response?.status === 401) {
      // Clear token from localStorage and cookies
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');

        // Only redirect to login if we're on a dashboard page
        const isDashboardPage = window.location.pathname.startsWith('/dashboard');
        if (isDashboardPage) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }

        // Remove cookie
        try {
          Cookies.remove('authToken', { path: '/' });
        } catch (e) {
          console.error('Failed to remove cookie:', e);
        }
      }
    }

    return Promise.reject(error);
  }
);