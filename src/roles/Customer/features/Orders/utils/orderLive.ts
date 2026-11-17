import { useCallback, useEffect, useRef } from 'react';

import fcmService from '@/services/fcmService';
import socketService from '@/services/socketService';

export interface OrderStatusEvent {
  orderId: string;
  status: string;
}

type Listener = (event: OrderStatusEvent) => void;

const listeners = new Set<Listener>();
let version = 0;
let lastKey = '';
let lastAt = 0;

// The same change can arrive twice (socket and push), so repeats within 3 seconds are dropped
function emitOrderStatus(event: OrderStatusEvent) {
  const key = `${event.orderId}:${event.status}`;
  const now = Date.now();
  if (key === lastKey && now - lastAt < 3000) return;
  lastKey = key;
  lastAt = now;
  version += 1;
  listeners.forEach(listener => listener(event));
}

export function subscribeOrderStatus(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// True once per change, so a screen that was not visible reloads when it comes back
export function useOrderStatusChecker(): () => boolean {
  const seen = useRef(version);
  return useCallback(() => {
    if (seen.current === version) return false;
    seen.current = version;
    return true;
  }, []);
}

function readEvent(source: any): OrderStatusEvent | null {
  const data = source?.data || {};
  const type = source?.type || data.type;
  if (type !== 'order_status_update' && type !== 'refurbished_order_status') return null;
  // Refurbished notifications carry only link: /orders/<id>
  const linkId = String(data.link || '').match(/\/orders\/([^/?#]+)/)?.[1];
  const orderId = String(data.orderId || source?.orderId || linkId || '');
  if (!orderId) return null;
  return { orderId, status: String(data.status || source?.status || '').toLowerCase() };
}

// Mounted once while a customer is logged in. Socket events and foreground push both end up here.
export function useOrderStatusLiveListener() {
  useEffect(() => {
    const offSocket = socketService.onNotification(payload => {
      const event = readEvent(payload);
      if (event) emitOrderStatus(event);
    });
    const offPush = fcmService.onMessageReceived(message => {
      const event = readEvent({ data: message?.data });
      if (event) emitOrderStatus(event);
    });
    return () => {
      offSocket();
      offPush();
    };
  }, []);
}
