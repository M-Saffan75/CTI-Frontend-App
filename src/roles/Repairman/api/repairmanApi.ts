import apiClient from '@/services/apiClient';

export interface RepairmanStats {
  totalJobs: number;
  activeJobs: number;
}

export interface JobDistributionSlice {
  label: string;
  count: number;
  color: string;
}

export interface EarningsDataPoint {
  label: string;
  value: number;
}

export const repairmanApi = {
  /**
   * Get earnings analytics for charts
   */
  async getEarningsAnalytics(): Promise<{ points: EarningsDataPoint[]; total: number } | null> {
    try {
      const res = await apiClient.get('/repairman/dashboard/earnings-analytics');
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      return null;
    } catch (error) {
      if (__DEV__) console.warn('[repairmanApi] getEarningsAnalytics failed:', error);
      return null;
    }
  },

  /**
   * Get job distribution for donut chart
   */
  async getJobDistribution(): Promise<{ distribution: JobDistributionSlice[]; total: number } | null> {
    try {
      const res = await apiClient.get('/repairman/dashboard/job-distribution');
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      return null;
    } catch (error) {
      if (__DEV__) console.warn('[repairmanApi] getJobDistribution failed:', error);
      return null;
    }
  },

  /**
   * Get offers analytics
   */
  async getOffersAnalytics(): Promise<any> {
    try {
      const res = await apiClient.get('/repairman/dashboard/offers-analytics');
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      return null;
    } catch (error) {
      if (__DEV__) console.warn('[repairmanApi] getOffersAnalytics failed:', error);
      return null;
    }
  },

  /**
   * Get scheduled calendar jobs
   */
  async getCalendarJobs(month: number, year: number): Promise<any[]> {
    try {
      const res = await apiClient.get(`/repairman/dashboard/calendar-jobs?month=${month}&year=${year}`);
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      if (__DEV__) console.warn('[repairmanApi] getCalendarJobs failed:', error);
      return [];
    }
  },

  /**
   * Get marketplace jobs on Job Board
   */
  async getJobBoard(): Promise<any[]> {
    try {
      const res = await apiClient.get('/repairman/job-board');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      if (__DEV__) console.warn('[repairmanApi] getJobBoard failed:', error);
      return [];
    }
  },

  /**
   * Get repairman's accepted/active jobs
   */
  async getMyJobs(): Promise<any[]> {
    try {
      const res = await apiClient.get('/repairman/my-jobs');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      if (__DEV__) console.warn('[repairmanApi] getMyJobs failed:', error);
      return [];
    }
  },

  /**
   * Get sent proposals / offers
   */
  async getMyOffers(): Promise<any[]> {
    try {
      const res = await apiClient.get('/repairman/offers');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      if (__DEV__) console.warn('[repairmanApi] getMyOffers failed:', error);
      return [];
    }
  },

  /**
   * Submit proposal on a job
   */
  async submitProposal(jobId: string, data: { price: number; notes: string; estimatedDays: number }): Promise<boolean> {
    try {
      const res = await apiClient.post(`/repairman/jobs/${jobId}/proposal`, data);
      return !!res.data?.success;
    } catch (error) {
      if (__DEV__) console.warn('[repairmanApi] submitProposal failed:', error);
      return false;
    }
  },

  /**
   * Update status of assigned job (e.g. In Progress, Completed)
   */
  async updateJobStatus(jobId: string, status: string): Promise<boolean> {
    try {
      const res = await apiClient.put(`/repairman/jobs/${jobId}/status`, { status });
      return !!res.data?.success;
    } catch (error) {
      if (__DEV__) console.warn('[repairmanApi] updateJobStatus failed:', error);
      return false;
    }
  },
};

export default repairmanApi;
