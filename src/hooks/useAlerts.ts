import { useState, useEffect, useCallback } from 'react';
import { getAlerts } from '../services/alertsService';
import type { Alert } from '../types/incidents';
import { useAlertStream } from './useAlertStream';

interface UseAlertsResult {
  alerts:  Alert[];
  loading: boolean;
  error:   string | null;
}

const MAX_ALERTS = 100;

export function useAlerts(): UseAlertsResult {
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Початкове завантаження історичних алертів
  useEffect(() => {
    let cancelled = false;

    getAlerts()
      .then((data) => { if (!cancelled) setAlerts(data.slice(0, MAX_ALERTS)); }) // Обрізаємо і початкові дані
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  // Нові алерти через WebSocket — додаємо на початок списку
  const handleNewAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => {
      if (prev.some((a) => a.id === alert.id)) {
        return prev; // Запобігаємо дублікатам
      }
      // Додаємо новий алерт на початок і обрізаємо до MAX_ALERTS
      return [alert, ...prev].slice(0, MAX_ALERTS);
    });
  }, []);

  useAlertStream({ onAlert: handleNewAlert });

  return { alerts, loading, error };
}