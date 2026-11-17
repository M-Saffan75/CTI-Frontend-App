import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import apiClient from './apiClient';
import fcmService from './fcmService';
import socketService from './socketService';

// The number of unread notifications for the bell icon in the headers.
// The backend count is the truth; the Notifications screen also writes it when the user reads or deletes one.
let count = 0;
const listeners = new Set<(value: number) => void>();

export function setUnreadNotifications(value: number) {
  const next = Math.max(0, value);
  if (next === count) return;
  count = next;
  listeners.forEach(listener => listener(next));
}

export async function refreshUnreadNotifications(): Promise<void> {
  try {
    const res = await apiClient.get('/notifications/unread-count');
    if (res.data?.success) setUnreadNotifications(Number(res.data?.data?.unreadCount) || 0);
  } catch {
    // keep the last number when the request fails
  }
}

export function useUnreadNotifications(): number {
  const [value, setValue] = useState(count);
  useEffect(() => {
    listeners.add(setValue);
    setValue(count);
    return () => {
      listeners.delete(setValue);
    };
  }, []);
  return value;
}

// Mounted once while someone is logged in: loads the count, and loads it again when a notification arrives
// (socket or push while the app is open) and when the app comes back to the foreground.
export function useUnreadNotificationsLive(enabled: boolean) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setUnreadNotifications(0);
      return undefined;
    }

    const refreshSoon = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(refreshUnreadNotifications, 500);
    };

    refreshUnreadNotifications();
    const offSocket = socketService.onNotification(refreshSoon);
    const offPush = fcmService.onMessageReceived(refreshSoon);
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') refreshUnreadNotifications();
    });

    return () => {
      offSocket();
      offPush();
      appState.remove();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled]);
}
