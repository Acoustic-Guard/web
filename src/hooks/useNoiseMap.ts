import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG, ENDPOINTS } from '../config/api';

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
 * Хук для завантаження акустичної телеметрії (рівнів шуму в децибелах) 
 * з подальшою передачею в шар візуалізації мапи. Реалізує періодичне оновлення 
 * даних (кожні 30 секунд) через механізм polling.
 */
export function useNoiseMap(): UseNoiseMapResult {
  const [points, setPoints]   = useState<NoisePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [tick, setTick]       = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_CONFIG.BASE_URL}${ENDPOINTS.noiseMap}`
        );
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

  return { points, loading, error, refresh };
}
