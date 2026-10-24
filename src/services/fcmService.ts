import { Platform, PermissionsAndroid } from 'react-native';
import {
  getMessaging,
  getToken,
  deleteToken,
  requestPermission,
  onMessage,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
  registerDeviceForRemoteMessages,
  isDeviceRegisteredForRemoteMessages,
  AuthorizationStatus,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationApi from './notificationApi';
import AuthService from './authService';

const FCM_TOKEN_STORAGE_KEY = '@cti_fcm_token';

type NotificationListener = (message: RemoteMessage) => void;

class FCMService {
  private listeners: Set<NotificationListener> = new Set();
  private isInitialized = false;

  private getMessagingInstance() {
    return getMessaging();
  }

  /**
   * Request push notification permissions (handles Android 13+ and iOS)
   */
  async requestUserPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'CTI needs permission to send you updates regarding your bookings, orders, and services.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      } else if (Platform.OS === 'ios') {
        const messaging = this.getMessagingInstance();
        const authStatus = await requestPermission(messaging);
        return (
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL
        );
      }
      return true;
    } catch (error) {
      if (__DEV__) console.warn('[FCMService] requestUserPermission failed:', error);
      return false;
    }
  }

  /**
   * Retrieve current FCM registration token
   */
  async getDeviceToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestUserPermission();
      if (!hasPermission) {
        if (__DEV__) console.log('[FCMService] Push notification permission not granted');
        return null;
      }

      const messaging = this.getMessagingInstance();

      // If iOS, ensure device is registered for remote messages
      if (Platform.OS === 'ios' && !isDeviceRegisteredForRemoteMessages(messaging)) {
        await registerDeviceForRemoteMessages(messaging);
      }

      const token = await getToken(messaging);
      if (token) {
        if (__DEV__) console.log('[FCMService] FCM Token retrieved successfully:', token.slice(0, 16) + '...');
        await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
        await this.syncTokenWithBackend(token);
      }
      return token;
    } catch (error) {
      if (__DEV__) console.warn('[FCMService] getDeviceToken failed:', error);
      return null;
    }
  }

  /**
   * Send the FCM token to backend if user is authenticated
   */
  async syncTokenWithBackend(token?: string): Promise<boolean> {
    try {
      const activeToken = token || (await AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY));
      if (!activeToken) return false;

      const session = await AuthService.getStoredSession();
      if (!session?.token) {
        if (__DEV__) console.log('[FCMService] User not authenticated; token cached for post-login sync.');
        return false;
      }

      const success = await notificationApi.updateFcmToken(activeToken);
      if (__DEV__) {
        console.log('[FCMService] Token synced with backend:', success ? 'SUCCESS' : 'FAILED');
      }
      return success;
    } catch (error) {
      if (__DEV__) console.warn('[FCMService] syncTokenWithBackend failed:', error);
      return false;
    }
  }

  /**
   * Delete FCM token on logout
   */
  async deleteToken(): Promise<void> {
    try {
      const messaging = this.getMessagingInstance();
      await deleteToken(messaging);
      await AsyncStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
      if (__DEV__) console.log('[FCMService] FCM token removed locally and unlinked from FCM.');
    } catch (error) {
      if (__DEV__) console.warn('[FCMService] deleteToken failed:', error);
    }
  }

  /**
   * Subscribe a listener for foreground notifications
   */
  onMessageReceived(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Initialize FCM listeners: foreground, background, token refresh, and open handlers
   */
  async initialize(onNotificationOpened?: (remoteMessage: RemoteMessage) => void): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const messaging = this.getMessagingInstance();

    // 1. Fetch & sync token
    await this.getDeviceToken();

    // 2. Token Refresh Listener
    onTokenRefresh(messaging, async (newToken) => {
      if (__DEV__) console.log('[FCMService] FCM Token refreshed:', newToken.slice(0, 16) + '...');
      await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, newToken);
      await this.syncTokenWithBackend(newToken);
    });

    // 3. Foreground Message Listener
    onMessage(messaging, async (remoteMessage) => {
      if (__DEV__) {
        console.log('[FCMService] Foreground notification received:', remoteMessage.notification?.title);
      }
      this.listeners.forEach((listener) => {
        try {
          listener(remoteMessage);
        } catch (err) {
          if (__DEV__) console.warn('[FCMService] listener error:', err);
        }
      });
    });

    // 4. Background state opened notification
    onNotificationOpenedApp(messaging, (remoteMessage) => {
      if (__DEV__) {
        console.log('[FCMService] Notification opened from background state:', remoteMessage.notification?.title);
      }
      if (onNotificationOpened) {
        onNotificationOpened(remoteMessage);
      }
    });

    // 5. Quit state initial notification
    const initialNotification = await getInitialNotification(messaging);
    if (initialNotification) {
      if (__DEV__) {
        console.log('[FCMService] Notification opened from quit state:', initialNotification.notification?.title);
      }
      if (onNotificationOpened) {
        onNotificationOpened(initialNotification);
      }
    }
  }
}

export const fcmService = new FCMService();
export default fcmService;
