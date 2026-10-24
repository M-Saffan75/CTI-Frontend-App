/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background handler for push notifications
try {
  setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
    if (__DEV__) {
      console.log('[FCM] Background push notification received:', remoteMessage.notification?.title);
    }
  });
} catch (e) {
  if (__DEV__) console.warn('[FCM] Failed to set background handler:', e);
}

AppRegistry.registerComponent(appName, () => App);
