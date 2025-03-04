import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// API URL from environment with HTTPS enforcement
const API_URL = process.env.REACT_APP_API_URL?.replace('http://', 'https://');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Create axios instance with additional config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseKey // Add Supabase anon key to all requests
  },
  withCredentials: false // Change to false to test basic connectivity
});

// Add request interceptor
api.interceptors.request.use(
  async (config) => {
    // Ensure HTTPS in production
    if (process.env.NODE_ENV === 'production' && config.url?.startsWith('http://')) {
      config.url = config.url.replace('http://', 'https://');
    }

    // Try to get Supabase session first
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
      config.headers.apikey = supabaseKey; // Ensure apikey is set for this request
    } else {
      // Fallback to stored token
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api; 