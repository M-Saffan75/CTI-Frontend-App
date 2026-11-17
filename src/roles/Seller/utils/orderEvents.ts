import { useCallback, useRef } from 'react';

export interface OrderChange {
  id: string;
  status: string;
  completionDate: string | null;
}

type Listener = (change: OrderChange) => void;

const listeners = new Set<Listener>();
let version = 0;

// Called after the backend confirmed a status change (start processing or cancel)
export function emitOrderChanged(change: OrderChange) {
  version += 1;
  listeners.forEach(listener => listener(change));
}

// Other seller changes that move Dashboard and Wallet numbers (return approved or rejected, enquiry answered)
export function markSellerDataChanged() {
  version += 1;
}

export function subscribeOrderChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Each screen that shows order based numbers (Dashboard, Wallet) gets its own checker.
// It returns true once per order change, so the screen reloads quietly when it is visible again.
export function useOrdersChangedChecker(): () => boolean {
  const seen = useRef(version);
  return useCallback(() => {
    if (seen.current === version) return false;
    seen.current = version;
    return true;
  }, []);
}
