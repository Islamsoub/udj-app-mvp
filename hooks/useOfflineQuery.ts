import { useState, useEffect, useRef, useCallback } from 'react';
import { useNetworkStore } from '@/stores/networkStore';

export interface UseOfflineQueryOptions<T> {
  cacheKey: string;
  getCached: () => Promise<T | null>;
  fetchFresh: () => Promise<T>;
  updateCache: (data: T) => Promise<void>;
  enabled?: boolean;
}

export interface UseOfflineQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isStale: boolean;
  isOffline: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useOfflineQuery<T>({
  cacheKey,
  getCached,
  fetchFresh,
  updateCache,
  enabled = true,
}: UseOfflineQueryOptions<T>): UseOfflineQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  // Keep refs to latest callbacks so the effect closure doesn't go stale
  const getCachedRef = useRef(getCached);
  const fetchFreshRef = useRef(fetchFresh);
  const updateCacheRef = useRef(updateCache);
  getCachedRef.current = getCached;
  fetchFreshRef.current = fetchFresh;
  updateCacheRef.current = updateCache;

  const pendingResolversRef = useRef<Array<() => void>>([]);

  const isOnline = useNetworkStore((s) => s.isOnline);
  const setLastSyncAt = useNetworkStore((s) => s.setLastSyncAt);

  useEffect(() => {
    if (!enabled) {
      // Release any refetch() promises awaiting this run — a disabled query
      // never reaches the finally block below, so callers would hang forever.
      const resolvers = pendingResolversRef.current.splice(0);
      for (const r of resolvers) r();
      return;
    }

    let cancelled = false;

    (async () => {
      try {
      // Step 1: Load cached data immediately (stale-while-revalidate)
      let cachedData: T | null = null;
      try {
        cachedData = await getCachedRef.current();
      } catch {
        // Cache read failure is non-fatal; proceed to network fetch
      }

      if (cancelled) return;

      if (cachedData !== null) {
        setData(cachedData);
        setIsLoading(false);
        setIsStale(true);
        setIsOffline(false);
        setError(null);
      } else {
        // No cache — show skeleton while fetching
        setIsLoading(true);
        setIsStale(false);
      }

      // Step 2: If device is offline, stop here and surface offline state
      if (!isOnline) {
        if (cancelled) return;
        if (cachedData !== null) {
          setIsOffline(true);
          setIsStale(false);
          setIsLoading(false);
        } else {
          setIsLoading(false);
          setIsOffline(true);
          setError(new Error('offline'));
        }
        return;
      }

      // Step 3: Fetch fresh data from the API
      try {
        const freshData = await fetchFreshRef.current();
        if (cancelled) return;

        try {
          await updateCacheRef.current(freshData);
        } catch (e) {
          // Cache write failure is non-fatal; still surface fresh data
          console.warn('[useOfflineQuery] cache write failed:', e);
        }

        // Re-read from cache so the rendered data is the canonical, deduped,
        // correctly-ordered, user-state-preserved copy from SQLite — not the
        // raw API array. Fall back to freshData only if the cache read fails.
        let canonical: T | null = null;
        try {
          canonical = await getCachedRef.current();
        } catch {
          // Cache read failure is non-fatal; fall back to freshData below
        }
        if (cancelled) return;

        setLastSyncAt(Date.now());
        setData(canonical ?? freshData);
        setIsStale(false);
        setIsOffline(false);
        setIsLoading(false);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        // A failed fetch is only "offline" when the network is actually down.
        // A 500/timeout from a reachable server is an error and must surface as
        // one — reporting it as offline sends the user to check their signal for
        // a server-side fault. The live store value is read rather than the
        // closed-over `isOnline`, which predates the request.
        const networkDown = !useNetworkStore.getState().isOnline;
        if (networkDown && cachedData !== null) {
          setIsOffline(true);
          setIsStale(false);
          setIsLoading(false);
          setError(null);
        } else {
          setIsLoading(false);
          setIsOffline(false);
          setError(err instanceof Error ? err : new Error('fetch failed'));
        }
      }
      } finally {
        if (!cancelled) {
          const resolvers = pendingResolversRef.current.splice(0);
          for (const r of resolvers) r();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetchKey, isOnline, setLastSyncAt, cacheKey]);

  const refetch = useCallback(() => {
    return new Promise<void>((resolve) => {
      pendingResolversRef.current.push(resolve);
      setFetchKey((k) => k + 1);
    });
  }, []);

  return { data, isLoading, isStale, isOffline, error, refetch };
}
