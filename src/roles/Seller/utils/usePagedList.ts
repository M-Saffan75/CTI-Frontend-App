import { useCallback, useEffect, useRef, useState } from 'react';

import useRefreshOnActive from '@/utils/useRefreshOnActive';
import i18n from '@/i18n';

export interface PagedResult<T, E> {
  items: T[];
  totalPages: number;
  totalItems: number;
  extra?: E;
}

type Mode = 'initial' | 'refresh' | 'more' | 'silent';

// One list with pages: full loading state first, then the final data once.
// enabled=false delays the first load (for tabs that were not opened yet).
// fetchPage must change (useCallback) whenever a filter changes, which reloads from page 1.
export default function usePagedList<T, E = undefined>(
  fetchPage: (page: number) => Promise<PagedResult<T, E>>,
  isActive: boolean = true,
  enabled: boolean = true,
  needsRefresh?: () => boolean,
) {
  const [items, setItems] = useState<T[]>([]);
  const [extra, setExtra] = useState<E | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const mounted = useRef(true);
  const requestId = useRef(0);
  const loadRef = useRef<(target: number, mode: Mode) => void>(() => {});
  const markLoaded = useRefreshOnActive(isActive, () => loadRef.current(1, 'silent'), needsRefresh);

  const load = useCallback(
    async (target: number, mode: Mode) => {
      const current = ++requestId.current;
      if (mode === 'refresh') setRefreshing(true);
      else if (mode === 'more') setLoadingMore(true);
      else if (mode === 'initial') {
        setLoading(true);
        setItems([]);
        setError(null);
      }

      try {
        const result = await fetchPage(target);
        if (!mounted.current || current !== requestId.current) return;
        setItems(prev => (mode === 'more' ? [...prev, ...result.items] : result.items));
        setExtra(result.extra);
        setPage(target);
        setHasMore(target < result.totalPages);
        setTotal(result.totalItems);
        setError(null);
        markLoaded();
      } catch (err: any) {
        if (!mounted.current || current !== requestId.current || mode === 'silent') return;
        const message = err?.message || i18n.t('sellerAuto.couldNotLoadTheList2');
        if (mode === 'initial') setError(message);
        else setLoadError(message);
      } finally {
        if (mounted.current && current === requestId.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [fetchPage, markLoaded],
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    loadRef.current = load;
    if (enabled) load(1, 'initial');
  }, [load, enabled]);

  const onRefresh = useCallback(() => load(1, 'refresh'), [load]);
  const retry = useCallback(() => load(1, 'initial'), [load]);
  const silentReload = useCallback(() => load(1, 'silent'), [load]);
  const onEndReached = useCallback(() => {
    if (!loading && !loadingMore && !refreshing && hasMore) load(page + 1, 'more');
  }, [loading, loadingMore, refreshing, hasMore, page, load]);

  const removeItem = useCallback((match: (item: T) => boolean) => {
    setItems(prev => prev.filter(item => !match(item)));
    setTotal(prev => Math.max(0, prev - 1));
  }, []);

  const updateItem = useCallback((match: (item: T) => boolean, patch: Partial<T>) => {
    setItems(prev => prev.map(item => (match(item) ? { ...item, ...patch } : item)));
  }, []);

  return {
    items,
    extra,
    total,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    loadError,
    clearLoadError: () => setLoadError(null),
    onRefresh,
    onEndReached,
    retry,
    silentReload,
    removeItem,
    updateItem,
  };
}
