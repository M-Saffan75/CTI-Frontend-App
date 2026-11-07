import AsyncStorage from '@react-native-async-storage/async-storage';
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

const CACHE_KEY = '@cti_customer_home_data';

export const homeApi = {
  /**
   * Purge any legacy cached data so no stale/dummy frontend data is ever displayed.
   */
  async purgeCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch {}
  },

  /**
   * Fetch live home page data from backend /home in real-time.
   * Strictly no local dummy or cached fallback data.
   */
  async getHomeData(): Promise<HomeData | null> {
    // Ensure legacy cache is purged
    this.purgeCache();

    try {
      const res = await apiClient.get('/home', { timeout: 25000 });
      if (res.data?.success && res.data?.data) {
        return res.data.data as HomeData;
      }
      return null;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[homeApi] getHomeData request failed:', error?.message);
      }
      return null;
    }
  },
};

export default homeApi;
