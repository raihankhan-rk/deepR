import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Supabase setup
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication Service
export const authService = {
  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },
  
  login: async (email: string, password: string) => {
    // FormData approach - keeping for reference but not using
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    // Log without iterating through entries
    console.log('Login attempt with email:', email);
    
    // Using URLSearchParams which works better with FastAPI OAuth form
    const urlParams = new URLSearchParams();
    urlParams.append('username', email);
    urlParams.append('password', password);
    
    try {
      const response = await api.post('/auth/token', urlParams, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      localStorage.setItem('access_token', response.data.access_token);
      return response.data;
    } catch (error) {
      console.error('Login request error:', error);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
  },
  
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Research Service
export const researchService = {
  startResearch: async (topic: string, additionalContext?: string) => {
    const response = await api.post('/research', { topic, additional_context: additionalContext });
    return response.data;
  },
  
  getResearchStatus: async (researchId: string) => {
    const response = await api.get(`/research/${researchId}/status`);
    return response.data;
  },
  
  getResearchReport: async (researchId: string) => {
    const response = await api.get(`/research/${researchId}`);
    return response.data;
  },
  
  downloadReportPdf: async (researchId: string) => {
    const response = await api.get(`/research/${researchId}/pdf`, {
      responseType: 'blob'
    });
    
    // Create a download link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `research_report.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  
  getResearchHistory: async () => {
    const response = await api.get('/research/history');
    return response.data;
  },
};

export default api; 