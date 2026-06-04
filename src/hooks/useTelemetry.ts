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

<<<<<<< HEAD
=======


    // Оновлення телеметрії кожні 30 секунд (як polling-fallback до WebSocket)

>>>>>>> 766fb1d5eaa99063e340f60fbd8cd47981197685
    const interval = setInterval(() => {

      getTelemetry()

        .then((data) => { if (!cancelled) setMetrics(data); })
<<<<<<< HEAD
        .catch(() => {});
=======

        .catch(() => {}); // тихо ігноруємо помилки при оновленні

>>>>>>> 766fb1d5eaa99063e340f60fbd8cd47981197685
    }, 30_000);



    return () => {

      cancelled = true;

      clearInterval(interval);

    };

  }, []);



  return { metrics, loading, error };

}