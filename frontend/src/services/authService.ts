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
    const redirectTo = `${window.location.origin}/auth/callback`;
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
    
    if (error) throw error;
    return data;
  },

  getCurrentUser: async () => {
    try {
      // Check localStorage for cached user data
      const cachedUser = localStorage.getItem('user_data');
      const cachedTimestamp = localStorage.getItem('user_data_timestamp');
      
      if (cachedUser && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp);
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        if (now - timestamp < oneHour) {
          return JSON.parse(cachedUser) as User;
        }
      }
      
      // Get Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        // Create a mock user from session data
        const mockUser: User = {
          id: 1,
          email: session.user?.email || 'unknown@example.com',
          username: session.user?.email ? session.user.email.split('@')[0] : 'unknown',
          created_at: new Date().toISOString()
        };
        
        // Store the mock user data
        localStorage.setItem('user_data', JSON.stringify(mockUser));
        localStorage.setItem('user_data_timestamp', Date.now().toString());
        
        // Try to get real user data in the background
        const API_URL = process.env.REACT_APP_API_URL;
        fetch(`${API_URL}/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }).then(async (response) => {
          if (response.ok) {
            const userData = await response.json();
            localStorage.setItem('user_data', JSON.stringify(userData));
            localStorage.setItem('user_data_timestamp', Date.now().toString());
          }
        });
        
        return mockUser;
      }
      
      // Check for regular token as fallback
      const token = localStorage.getItem('access_token');
      if (token) {
        const response = await api.get('/users/me');
        const userData = response.data;
        
        localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.setItem('user_data_timestamp', Date.now().toString());
        
        return userData;
      }
      
      return null;
    } catch (error) {
      const cachedUser = localStorage.getItem('user_data');
      if (cachedUser) {
        return JSON.parse(cachedUser) as User;
      }
      return null;
    }
  },

  logout: async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_data_timestamp');
    await supabase.auth.signOut();
  }
};

export default authService; 