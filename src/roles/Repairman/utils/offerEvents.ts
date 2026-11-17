import { useCallback, useEffect, useRef } from 'react';

import fcmService from '@/services/fcmService';
import socketService from '@/services/socketService';

// Set when the repairman's offers change: a proposal was sent, withdrawn or accepted, or the customer answered one.
// The Job Board, My Offers and Dashboard each get their own checker and reload quietly when they are shown again.
// Screens that are open right now also subscribe and reload at once.
let version = 0;
const listeners = new Set<() => void>();

export function markOffersChanged() {
  version += 1;
  listeners.forEach(listener => listener());
}

export function subscribeOffersChanged(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useOffersChangedChecker(): () => boolean {
  const seen = useRef(version);
  return useCallback(() => {
    if (seen.current === version) return false;
    seen.current = version;
    return true;
  }, []);
}

// Backend notification types sent to the repairman when the customer acts on an offer
// (offer_accepted: the customer picked the offer, so the others on that job are rejected)
const OFFER_TYPES = ['offer_accepted', 'offer_rejected', 'offer_updated'];
let lastKey = '';
let lastAt = 0;

function readType(source: any): string {
  return String(source?.type || source?.data?.type || '');
}

// The same change can arrive twice (socket and push), so repeats within 3 seconds are dropped
function onOfferNotification(source: any) {
  const type = readType(source);
  if (!OFFER_TYPES.includes(type)) return;
  const key = `${type}:${source?.data?.offerId || source?.offerId || ''}`;
  const now = Date.now();
  if (key === lastKey && now - lastAt < 3000) return;
  lastKey = key;
  lastAt = now;
  markOffersChanged();
}

// Mounted once while a repairman is logged in
export function useRepairmanOfferLiveListener() {
  useEffect(() => {
    const offSocket = socketService.onNotification(onOfferNotification);
    const offPush = fcmService.onMessageReceived(message =>
      onOfferNotification({ data: message?.data }),
    );
    return () => {
      offSocket();
      offPush();
    };
  }, []);
}
