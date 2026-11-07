import { useCallback, useState } from 'react';

export interface UsePaginationOptions<T> {
  fetchPage: (page: number) => Promise<{ data: T[]; total?: number; totalPages?: number }>;
  initialPage?: number;
  pageSize?: number;
}

export function usePagination<T>({
  fetchPage,
  initialPage = 1,
  pageSize = 20,
}: UsePaginationOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (targetPage: number, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (targetPage === initialPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const result = await fetchPage(targetPage);
        const incoming = result.data || [];

        if (isRefresh || targetPage === initialPage) {
          setItems(incoming);
        } else {
          setItems(prev => [...prev, ...incoming]);
        }

        setPage(targetPage);

        if (result.totalPages !== undefined) {
          setHasMore(targetPage < result.totalPages);
        } else if (result.total !== undefined) {
          const loadedCount = (targetPage - 1) * pageSize + incoming.length;
          setHasMore(loadedCount < result.total);
        } else {
          setHasMore(incoming.length >= pageSize);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [fetchPage, initialPage, pageSize],
  );

  const onRefresh = useCallback(() => {
    loadData(initialPage, true);
  }, [loadData, initialPage]);

  const onEndReached = useCallback(() => {
    if (!loading && !loadingMore && !refreshing && hasMore) {
      loadData(page + 1, false);
    }
  }, [loading, loadingMore, refreshing, hasMore, loadData, page]);

  return {
    items,
    setItems,
    page,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    onRefresh,
    onEndReached,
    reload: () => loadData(initialPage, false),
  };
}

export default usePagination;

