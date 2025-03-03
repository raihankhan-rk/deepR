import researchService from './researchService';

interface CachedReport {
  data: any;
  timestamp: number;
}

const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes
const REPORTS_CACHE_KEY = 'cached_reports';
const HISTORY_CACHE_KEY = 'cached_history';

const cacheService = {
  async prefetchAndCacheReports() {
    try {
      // First get the history
      const history = await researchService.getResearchHistory();
      localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify({
        data: history,
        timestamp: Date.now()
      }));

      // Then fetch each report in parallel
      const reports = await Promise.all(
        history.researches.map(async (research) => {
          try {
            const report = await researchService.getResearchResult(research.id);
            return {
              id: research.id,
              data: report
            };
          } catch (error) {
            console.error(`Failed to fetch report ${research.id}:`, error);
            return null;
          }
        })
      );

      // Filter out failed fetches and store in cache
      const validReports = reports.filter(report => report !== null);
      const cacheData = {
        data: validReports,
        timestamp: Date.now()
      };
      localStorage.setItem(REPORTS_CACHE_KEY, JSON.stringify(cacheData));

      return {
        history: history,
        reports: validReports
      };
    } catch (error) {
      console.error('Failed to prefetch reports:', error);
      throw error;
    }
  },

  getCachedHistory() {
    const cached = localStorage.getItem(HISTORY_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(HISTORY_CACHE_KEY);
      return null;
    }

    return data;
  },

  getCachedReport(reportId: string) {
    const cached = localStorage.getItem(REPORTS_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(REPORTS_CACHE_KEY);
      return null;
    }

    const report = data.find((r: any) => r.id === reportId);
    return report ? report.data : null;
  },

  clearCache() {
    localStorage.removeItem(REPORTS_CACHE_KEY);
    localStorage.removeItem(HISTORY_CACHE_KEY);
  }
};

export default cacheService; 