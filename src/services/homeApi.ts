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
   * Fast read from local AsyncStorage cache so HomeScreen can render instantly (0ms delay).
   */
  async getCachedHomeData(): Promise<HomeData | null> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch {
      // Ignore cache read errors
    }
    return null;
  },

  /**
   * Fetch live home page data from backend /home with cold-start auto-retry and cache-fallback.
   */
  async getHomeData(options?: { maxRetries?: number }): Promise<HomeData | null> {
    const maxRetries = options?.maxRetries ?? 2; // 3 attempts total (0, 1, 2)
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await apiClient.get('/home', { timeout: 30000 });
        if (res.data?.success && res.data?.data) {
          const data: HomeData = res.data.data;
          // Cache successful data for instant loading next time
          AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => { });
          return data;
        }
      } catch (error: any) {
        lastError = error;
        const status = error?.response?.status;
        const isTimeout =
          error?.code === 'ECONNABORTED' ||
          error?.message?.includes('timeout') ||
          status === 504;
        const isColdStart = status === 502 || status === 503;
        const isNetworkErr = !error?.response || error?.message === 'Network Error';

        const isRetryable = isTimeout || isColdStart || isNetworkErr;

        if (isRetryable && attempt < maxRetries) {
          const delay = (attempt + 1) * 1500;
          if (__DEV__) {
            console.log(
              `[homeApi] Server waking up / request failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`
            );
          }
          await new Promise<void>(resolve => {
            setTimeout(() => resolve(), delay);
          });
          continue;
        }
        break;
      }
    }

    if (__DEV__) {
      console.warn('[homeApi] getHomeData all retries failed:', lastError?.message || lastError);
    }

    // Graceful fallback to cache if server completely failed
    const cached = await this.getCachedHomeData();
    if (cached) {
      if (__DEV__) console.log('[homeApi] Serving cached data as fallback.');
      return cached;
    }

    return null;
  },
};

export default homeApi;
