import apiClient from './apiClient';

export interface HomeData {
  categories: any[];
  banners: any[];
  blogs: any[];
  reviews: any[];
  repairmen: any[];
  sellers: any[];
  services: any[];
}

export const homeApi = {
  /**
   * Fetch live home page data from backend /home
   */
  async getHomeData(): Promise<HomeData | null> {
    try {
      const res = await apiClient.get('/home');
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      return null;
    } catch (error) {
      if (__DEV__) console.warn('[homeApi] getHomeData failed:', error);
      return null;
    }
  },
};

export default homeApi;
