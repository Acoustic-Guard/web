import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithRetry, ENDPOINTS } from '../config/api';
import { useConnection } from '../context/ConnectionContext';

export interface NoisePoint {
  latitude: number;
  longitude: number;
  db: number;
}

interface UseNoiseMapResult {
  points: NoisePoint[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const REFRESH_INTERVAL_MS = 30_000;

/**
 * Hook for loading acoustic telemetry (noise levels in decibels)
 * with subsequent transmission to the map visualization layer. Implements periodic data
 * updates (every 30 seconds) via polling mechanism.
 */
export function useNoiseMap(): UseNoiseMapResult {
  const [points, setPoints]   = useState<NoisePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [tick, setTick]       = useState(0);
  const { isOnline } = useConnection();
  const previousIsOnline = useRef(true);
  const isInitialMount = useRef(true);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithRetry(ENDPOINTS.noiseMap);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data: NoisePoint[] = await response.json();
        if (!cancelled) setPoints(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setPoints([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    const timer = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [tick]);

  // Rehydrate data when connection is restored (false -> true transition)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!previousIsOnline.current && isOnline) {
      console.log('Connection restored, rehydrating noise map data');
      refresh();
    }

    previousIsOnline.current = isOnline;
  }, [isOnline, refresh]);

  return { points, loading, error, refresh };
}
