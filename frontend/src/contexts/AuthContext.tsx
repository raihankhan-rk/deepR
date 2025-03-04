import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import cacheService from '../services/cacheService';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Initialize auth state from cached data
    const initializeAuth = async () => {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      
      // If user is authenticated, start prefetching reports
      if (userData) {
        try {
          cacheService.prefetchAndCacheReports().catch(error => {
            console.error('Failed to prefetch reports:', error);
          });
        } catch (error) {
          console.error('Error initiating prefetch:', error);
        }
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await authService.login(email, password);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      
      // Start prefetching reports after successful login
      cacheService.prefetchAndCacheReports().catch(error => {
        console.error('Failed to prefetch reports after login:', error);
      });
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      await authService.register(username, email, password);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      
      // Start prefetching reports after successful registration
      cacheService.prefetchAndCacheReports().catch(error => {
        console.error('Failed to prefetch reports after registration:', error);
      });
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      // Clear the cache on logout
      cacheService.clearCache();
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 