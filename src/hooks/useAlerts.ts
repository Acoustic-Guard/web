import { useState, useEffect, useCallback } from 'react';
import { getAlerts } from '../services/alertsService';
import type { Alert } from '../types/incidents';
import { useAlertStream } from './useAlertStream';
import { useAuth } from './useAuth';

interface UseAlertsResult {
  alerts:  Alert[];
  loading: boolean;
  error:   string | null;
}

const MAX_ALERTS = 100;

/**
 * Кастомний хук для управління станом оперативних попереджень.
 * Відповідає за початкове завантаження історичних даних через REST API 
 * та автоматичне оновлення списку при надходженні нових подій через WebSocket.
 * * @returns Об'єкт зі списком попереджень, станом завантаження та можливими помилками.
 */
export function useAlerts(): UseAlertsResult {
  const { user } = useAuth();
  const [alerts, setAlerts]   = useState<Alert[]>([]);
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

    getAlerts()
      .then((data) => { 
        if (!cancelled) setAlerts(data.slice(0, MAX_ALERTS)); 
      }) 
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [user]);

  const handleNewAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => {
      if (prev.some((a) => a.id === alert.id)) return prev;
      return [alert, ...prev].slice(0, MAX_ALERTS);
    });
  }, []);

  useAlertStream({ onAlert: handleNewAlert });

  return { alerts, loading, error };
}