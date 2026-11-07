import { QueryClient, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

// Connect React Query's online status manager to NetInfo
onlineManager.setEventListener(setOnline => {
  return NetInfo.addEventListener(state => {
    // If isInternetReachable is null (unknown/initial), consider connected if isConnected is true
    const isOnline = Boolean(state.isConnected && (state.isInternetReachable ?? true));
    setOnline(isOnline);
  });
});

/**
 * Global QueryClient configured with:
 * - Sensible staleTime (3 minutes) and garbage collection time (15 minutes).
 * - No retry on 4xx client errors (400, 401, 403, 404, 410, 422).
 * - Retries on network / server cold-start errors (max 2 retries).
 * - No automatic refetch on window focus for React Native.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes
      retry: (failureCount, error: any) => {
        const status = error?.status ?? error?.response?.status;
        // Do not retry 4xx errors
        if (typeof status === 'number' && status >= 400 && status < 500) {
          return false;
        }
        // A few retries on network errors or 5xx server errors
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

export default queryClient;

