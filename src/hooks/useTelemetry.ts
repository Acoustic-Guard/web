import { useState, useEffect, useCallback } from 'react';
import { getTelemetry } from '../services/telemetryService';
import { useAuth } from './useAuth';
import { useTelemetryStream } from './useTelemetryStream';
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

    Promise.resolve().then(() => {
      if (!cancelled) {
        setError(null);
        setLoading(true);
      }
    });

    const fetchInitialTelemetry = () => {
      getTelemetry()
        .then((data) => { 
          if (!cancelled) setMetrics(data); 
        })
        .catch((err) => { if (!cancelled) setError(err.message); })
        .finally(() => { if (!cancelled) setLoading(false); });
    };

    fetchInitialTelemetry();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleNewTelemetry = useCallback((newMetrics: MetricCardProps[]) => {
    setMetrics(newMetrics);
  }, []);

  useTelemetryStream({ onTelemetry: handleNewTelemetry });

  return { metrics, loading, error };
}