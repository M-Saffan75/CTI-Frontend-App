import { clearAllTokens } from './tokenStorage';
import { queryClient } from './queryClient';
import socketService from './socketService';
import fcmService from './fcmService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LogoutListener = () => void;
const unauthorizedListeners: Set<LogoutListener> = new Set();

let isLoggingOut = false;

/**
 * Register a listener to be notified when a 401 unauthorized or clean logout occurs.
 * Used by RootNavigator to update app-level state without circular imports.
 */
export function onAuthLogout(listener: LogoutListener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

/**
 * Clean logout through app-level auth state:
 * 1. Clear secure tokens from Keychain
 * 2. Clear React Query cache
 * 3. Disconnect Socket
 * 4. Clear/unregister FCM push token
 * 5. Clear non-sensitive session keys from AsyncStorage
 * 6. Notify app-level listeners to reset navigation to auth/role-select
 */
export async function triggerCleanLogout(): Promise<void> {
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    // 1. Delete/unassign FCM push token on backend and local storage while auth is still valid
    await fcmService.deleteToken().catch(() => {});

    // 2. Clear Keychain tokens
    await clearAllTokens().catch(() => {});

    // 3. Clear Query cache
    queryClient.clear();

    // 4. Disconnect real-time socket
    socketService.disconnect();

    // 5. Clear stored session objects from AsyncStorage
    await Promise.all([
      AsyncStorage.removeItem('user'),
      AsyncStorage.removeItem('role'),
      AsyncStorage.removeItem('auth'),
      AsyncStorage.removeItem('token'),
      AsyncStorage.removeItem('refreshToken'),
    ]).catch(() => {});

    // 6. Notify app listeners (RootNavigator state update)
    unauthorizedListeners.forEach(listener => {
      try {
        listener();
      } catch (err) {
        if (__DEV__) {
          console.warn('[authEvents] Listener error:', err);
        }
      }
    });
  } finally {
    isLoggingOut = false;
  }
}

