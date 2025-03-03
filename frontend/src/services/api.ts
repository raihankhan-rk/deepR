import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// API URL from environment
const API_URL = process.env.REACT_APP_API_URL;

console.log('API URL:', API_URL);

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

// Add request interceptor with debug logging
api.interceptors.request.use(
  async (config) => {
    console.log('Making request to:', config.url);
    console.log('Request headers before auth:', config.headers);
    
    // Try to get Supabase session first
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
      config.headers.apikey = supabaseKey; // Ensure apikey is set for this request
      console.log('Using Supabase token for request');
    } else {
      // Fallback to stored token
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Using stored token for request');
      } else {
        console.log('No token available for request');
      }
    }
    
    console.log('Final request headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

export default api; 