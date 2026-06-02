import { useState, useEffect, useCallback } from 'react';
import { getAlerts } from '../services/alertsService';
import type { Alert } from '../types/incidents';
import { useAlertStream } from './useAlertStream';

interface UseAlertsResult {
  alerts:  Alert[];
  loading: boolean;
  error:   string | null;
}

export function useAlerts(): UseAlertsResult {
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Початкове завантаження históричних алертів
  useEffect(() => {
    let cancelled = false;

    getAlerts()
      .then((data) => { if (!cancelled) setAlerts(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  // Нові алерти через WebSocket — додаємо на початок списку
  const handleNewAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => {
      if (prev.some((a) => a.id === alert.id)) {
        return prev; // Prevent duplicate injection
      }
      return [alert, ...prev];
    });
  }, []);

  useAlertStream({ onAlert: handleNewAlert });

  return { alerts, loading, error };
}