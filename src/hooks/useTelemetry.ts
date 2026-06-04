import { useState, useEffect } from 'react';
import { getTelemetry } from '../services/telemetryService';
import { useAuth } from './useAuth';
import type { MetricCardProps } from '../types/telemetry';

interface UseTelemetryResult {
  metrics: MetricCardProps[];
  loading: boolean;
  error:   string | null;
}

export function useTelemetry(): UseTelemetryResult {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<MetricCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchInitialTelemetry = () => {
      getTelemetry()
        .then((data) => { 
          if (!cancelled) {
            setMetrics(data); 
            setError(null);
          }
        })
        .catch((err) => { if (!cancelled) setError(err.message); })
        .finally(() => { if (!cancelled) setLoading(false); });
    };

    fetchInitialTelemetry();

    const interval = setInterval(() => {
      getTelemetry()
        .then((data) => { 
          if (!cancelled) {
            setMetrics(data);
            setError(null);
          }
        })
        .catch(() => {});
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  return { metrics, loading, error };
}