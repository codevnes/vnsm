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
    console.log(`API Request to ${config.url}, token exists:`, !!token);

    if (token) {
      try {
        // Log token details without exposing sensitive parts
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          // Only decode and log the payload part (middle section)
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('Token payload:', {
            userId: payload.userId,
            email: payload.email?.substring(0, 3) + '***',
            role: payload.role,
            exp: new Date(payload.exp * 1000).toISOString(),
            iat: new Date(payload.iat * 1000).toISOString(),
          });
        }
      } catch (e) {
        console.warn('Failed to decode token for debugging:', e);
      }

      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set:', `Bearer ${token.substring(0, 15)}...`);
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
      console.log('Unauthorized API response, clearing token');
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