import api from './api';
import cacheService from './cacheService';

// Define interfaces
interface ResearchRequest {
  topic: string;
  additional_context?: string;
}

interface ResearchResponse {
  research_id: string;
  status: string;
  estimated_time: number;
}

interface ResearchResult {
  id: string;
  topic: string;
  summary: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  created_at: string;
}

interface ResearchHistoryResponse {
  researches: Array<{
    id: string;
    user_id: number;
    topic: string;
    created_at: string;
  }>;
}

// Research service with methods for research operations
const researchService = {
  startResearch: async (topic: string, additional_context?: string): Promise<ResearchResponse> => {
    const response = await api.post('/research', { topic, additional_context });
    return response.data;
  },

  getResearchStatus: async (researchId: string): Promise<{ status: string }> => {
    const response = await api.get(`/research/${researchId}/status`);
    return response.data;
  },

  getResearchResult: async (researchId: string): Promise<ResearchResult> => {
    // Try to get from cache first
    const cachedReport = cacheService.getCachedReport(researchId);
    if (cachedReport) {
      return cachedReport;
    }

    // If not in cache, fetch from API
    const response = await api.get(`/research/${researchId}`);
    return response.data;
  },

  getResearchHistory: async (): Promise<ResearchHistoryResponse> => {
    // Try to get from cache first
    const cachedHistory = cacheService.getCachedHistory();
    if (cachedHistory) {
      return cachedHistory;
    }

    // If not in cache, fetch from API
    const response = await api.get('/research/history');
    return response.data;
  },

  downloadPdf: async (researchId: string): Promise<Blob> => {
    const response = await api.get(`/research/${researchId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default researchService; 