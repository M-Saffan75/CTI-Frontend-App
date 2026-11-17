import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, normalizeApiError } from '@/services/apiError';

// One request with loading, error and reload. A new load (filter change, retry) clears the old data;
// a silent reload (pull to refresh, coming back to the tab) keeps what is on screen and only replaces it on success.
// reload returns the error (or null), so a pull to refresh can tell the user when it failed.
// A slow answer for an old filter is ignored, and nothing is set after the screen closes.
export default function useApiData<T>(fetcher: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async (silent: boolean = false): Promise<ApiError | null> => {
    const id = ++requestId.current;
    if (!silent) {
      setLoading(true);
      setData(null);
      setError(null);
    }
    try {
      const result = await fetcherRef.current();
      if (id === requestId.current) {
        setData(result);
        setError(null);
      }
      return null;
    } catch (e) {
      const apiError = normalizeApiError(e);
      if (id === requestId.current && !silent) setError(apiError);
      return apiError;
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      requestId.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload: load };
}
