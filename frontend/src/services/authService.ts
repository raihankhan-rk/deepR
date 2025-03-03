import { api, supabase } from './api';
import { Session } from '@supabase/supabase-js';

// Define response types
interface ApiResponse {
  data: any;
  status: number;
}

interface SupabaseSessionResult {
  data: {
    session: Session | null;
  };
  error: Error | null;
}

interface FetchResponse extends Response {
  ok: boolean;
  status: number;
  json(): Promise<any>;
  text(): Promise<string>;
}

interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

// Define AuthService interface
interface AuthService {
  login: (email: string, password: string) => Promise<any>;
  register: (username: string, email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  getCurrentUser: () => Promise<User | null>;
  logout: () => Promise<void>;
}

// Auth service with methods for auth operations
const authService: AuthService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/token', { username: email, password });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },

  signInWithGoogle: async () => {
    try {
      console.log('Initiating Google sign-in...');
      
      // Important: Set the correct redirect URL
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log('Setting redirect URL to:', redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          scopes: 'email profile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      console.log('Google sign-in response:', { data, error });
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error signing in with Google:', err);
      throw err;
    }
  },

  getCurrentUser: async () => {
    try {
      // First, check localStorage for cached user data
      const cachedUser = localStorage.getItem('user_data');
      const cachedTimestamp = localStorage.getItem('user_data_timestamp');
      
      // If we have cached data and it's less than 1 hour old, use it
      if (cachedUser && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp);
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        if (now - timestamp < oneHour) {
          console.log('Using cached user data');
          return JSON.parse(cachedUser) as User;
        }
      }
      
      // If no valid cache, try to get Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        try {
          // Create a mock user from session data
          const mockUser: User = {
            id: 1,
            email: session.user?.email || 'unknown@example.com',
            username: session.user?.email ? session.user.email.split('@')[0] : 'unknown',
            created_at: new Date().toISOString()
          };
          
          // Store the mock user data in localStorage
          localStorage.setItem('user_data', JSON.stringify(mockUser));
          localStorage.setItem('user_data_timestamp', Date.now().toString());
          
          // Try to get real user data from backend in the background
          const API_URL = process.env.REACT_APP_API_URL || 'http://0.0.0.0:8000/api';
          fetch(`${API_URL}/users/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }).then(async (response) => {
            if (response.ok) {
              const userData = await response.json();
              // Update cached user data with real data from backend
              localStorage.setItem('user_data', JSON.stringify(userData));
              localStorage.setItem('user_data_timestamp', Date.now().toString());
            }
          }).catch(error => {
            console.error('Background fetch failed:', error);
          });
          
          return mockUser;
        } catch (error) {
          console.error('Error getting user data:', error);
          throw error;
        }
      }
      
      // Check for regular token as fallback
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await api.get('/users/me');
          const userData = response.data;
          
          // Cache the user data
          localStorage.setItem('user_data', JSON.stringify(userData));
          localStorage.setItem('user_data_timestamp', Date.now().toString());
          
          return userData;
        } catch (error) {
          console.error('Error getting user data with token:', error);
          throw error;
        }
      }
      
      return null;
    } catch (error) {
      console.error('getCurrentUser error:', error);
      
      // If we have cached data, return it as a last resort
      const cachedUser = localStorage.getItem('user_data');
      if (cachedUser) {
        return JSON.parse(cachedUser) as User;
      }
      
      return null;
    }
  },

  logout: async () => {
    try {
      // Clear all stored data
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_data_timestamp');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      console.log('Successfully logged out');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }
};

export default authService; 