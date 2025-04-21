'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, Role } from '@/types/user';
import { api } from '@/lib/api';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie'; 
// Interface for JWT payload
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  loading: boolean; // renamed from isLoading for consistency with component usage
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Cookie name for authentication token
const AUTH_COOKIE_NAME = 'authToken';
// Cookie options
const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === 'production', // Only use secure in production
  path: '/',
  sameSite: 'strict' as const, // Prevent CSRF attacks
  expires: 7, // 7 days
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start loading until token checked

  // Extract user data from JWT token since we don't have /auth/me endpoint yet
  const getUserFromToken = (token: string): User | null => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      // Create a user object from the token payload
      return {
        id: decoded.userId,
        email: decoded.email,
        full_name: '', // Not in token, would be fetched from /auth/me
        role: decoded.role as Role,
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  };

  // Fetch user data if token exists
  useEffect(() => {
    const fetchUserData = async () => {
      console.log('Fetching user data, token exists:', !!token);
      if (!token) {
        console.log('No token, clearing user state');
        setUserState(null);
        setLoading(false);
        return;
      }

      try {
        // Extract user from token for fallback
        const userFromToken = getUserFromToken(token);
        console.log('User from token:', userFromToken ? `ID: ${userFromToken.id}, Role: ${userFromToken.role}` : 'Failed to decode');

        // Try to fetch user from API, use token data as fallback
        try {
          // Call your API endpoint to get user data
          console.log('Making request to /auth/me endpoint');
          const response = await api.get('/auth/me');
          if (response.data) {
            console.log('User data fetched from API:', response.data);
            setUserState(response.data);
          }
        } catch (error: any) {
          console.error('Failed to fetch user from API:', error.response?.status, error.response?.data);
          
          // If we have token data, use it as fallback regardless of error type
          if (userFromToken) {
            console.log('Using user data from token instead');
            setUserState({
              ...userFromToken,
              // Add a flag to indicate this is from token, not API
              _source: 'token' 
            });
          } else {
            // If token decoding failed, logout
            console.log('Token decoding failed, logging out');
            setTokenState(null);
            Cookies.remove(AUTH_COOKIE_NAME, { path: '/' });
            localStorage.removeItem('authToken');
          }
        }
      } catch (error: any) {
        console.error('Failed to process user data:', error);
        // If unauthorized or any error, clear token
        setTokenState(null);
        Cookies.remove(AUTH_COOKIE_NAME, { path: '/' });
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  // Load token from localStorage on initial render
  useEffect(() => {
    // Try to load token from localStorage on initial client render
    try {
      const storedToken = localStorage.getItem('authToken') || Cookies.get(AUTH_COOKIE_NAME);
      console.log('Initial auth check, token found:', !!storedToken);
      if (storedToken) {
        setTokenState(storedToken);
      } else {
        setLoading(false); // If no token, we're not loading anymore
      }
    } catch (error) {
        console.error("Could not access localStorage or cookies:", error);
        setLoading(false);
    }
  }, []);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    try {
        if (newToken) {
          localStorage.setItem('authToken', newToken);
          Cookies.set(AUTH_COOKIE_NAME, newToken, COOKIE_OPTIONS);
        } else {
          localStorage.removeItem('authToken');
          Cookies.remove(AUTH_COOKIE_NAME, { path: '/' });
          setUserState(null);
        }
    } catch (error) {
        console.error("Could not access localStorage or cookies:", error);
    }
  };

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    // Additional cleanup if needed
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{
      token,
      setToken,
      user,
      setUser,
      isAuthenticated,
      loading,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};