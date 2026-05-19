import { useState, useEffect } from 'react';
import { getTelemetry } from '../services/telemetryService';
import type { MetricCardProps } from '../types/telemetry';

interface UseTelemetryResult {
  metrics: MetricCardProps[];
  loading: boolean;
  error:   string | null;
}

export function useTelemetry(): UseTelemetryResult {
  const [metrics, setMetrics] = useState<MetricCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getTelemetry()
      .then((data) => { if (!cancelled) setMetrics(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    // Оновлення телеметрії кожні 30 секунд (як polling-fallback до WebSocket)
    const interval = setInterval(() => {
      getTelemetry()
        .then((data) => { if (!cancelled) setMetrics(data); })
        .catch(() => {}); // тихо ігноруємо помилки при оновленні
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { metrics, loading, error };
}