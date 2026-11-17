import { useCallback, useEffect, useRef } from 'react';

import fcmService from '@/services/fcmService';
import socketService from '@/services/socketService';

export interface JobChange {
  jobId: string;
  type: string;
}

type Listener = (change: JobChange) => void;

// A repairman sent an offer on one of the customer's jobs (backend notification type new_offer),
// or changed a booking (booking_status_update)
const JOB_TYPES = ['new_offer', 'booking_status_update'];

const listeners = new Set<Listener>();
let version = 0;
let lastKey = '';
let lastAt = 0;

// The same change can arrive twice (socket and push), so repeats within 3 seconds are dropped
function emitJobChange(change: JobChange) {
  const key = `${change.type}:${change.jobId}`;
  const now = Date.now();
  if (key === lastKey && now - lastAt < 3000) return;
  lastKey = key;
  lastAt = now;
  version += 1;
  listeners.forEach(listener => listener(change));
}

export function subscribeJobChanges(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// True once per change, so a screen that was not visible reloads when it comes back
export function useJobChangedChecker(): () => boolean {
  const seen = useRef(version);
  return useCallback(() => {
    if (seen.current === version) return false;
    seen.current = version;
    return true;
  }, []);
}

function readChange(source: any): JobChange | null {
  const data = source?.data || {};
  const type = String(source?.type || data.type || '');
  if (!JOB_TYPES.includes(type)) return null;
  return { type, jobId: String(data.jobId || source?.jobId || '') };
}

// Mounted once while a customer is logged in. Socket events and foreground push both end up here.
export function useJobLiveListener() {
  useEffect(() => {
    const offSocket = socketService.onNotification(payload => {
      const change = readChange(payload);
      if (change) emitJobChange(change);
    });
    const offPush = fcmService.onMessageReceived(message => {
      const change = readChange({ data: message?.data });
      if (change) emitJobChange(change);
    });
    return () => {
      offSocket();
      offPush();
    };
  }, []);
}
