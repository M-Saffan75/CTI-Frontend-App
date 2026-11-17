import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

const STALE_MS = 60000;
// Coming back from the browser (website steps) reloads after a shorter time
const RESUME_STALE_MS = 15000;

// Seller tabs stay mounted, so a tab loads once. When it becomes visible again
// the data is reloaded quietly (no loading state) only if it is older than
// staleMs or needsRefresh says so. Call the returned function after each load.
export default function useRefreshOnActive(
  isActive: boolean,
  refresh: () => void,
  needsRefresh?: () => boolean,
  staleMs: number = STALE_MS,
) {
  const loadedAt = useRef(0);
  const wasActive = useRef(isActive);
  const refreshRef = useRef(refresh);
  const needsRef = useRef(needsRefresh);
  const activeRef = useRef(isActive);

  useEffect(() => {
    refreshRef.current = refresh;
    needsRef.current = needsRefresh;
    activeRef.current = isActive;
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active' || !activeRef.current || loadedAt.current === 0) return;
      if (Date.now() - loadedAt.current > RESUME_STALE_MS) refreshRef.current();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (isActive && !wasActive.current && loadedAt.current > 0) {
      const stale = Date.now() - loadedAt.current > staleMs;
      const forced = needsRef.current ? needsRef.current() : false;
      if (stale || forced) refreshRef.current();
    }
    wasActive.current = isActive;
  }, [isActive, staleMs]);

  return useCallback(() => {
    loadedAt.current = Date.now();
  }, []);
}
