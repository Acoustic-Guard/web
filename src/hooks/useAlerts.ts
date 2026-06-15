import { useState, useEffect, useCallback, useRef } from 'react';
import { getAlerts } from '../services/alertsService';
import type { Alert } from '../types/incidents';
import { useAlertStream } from './useAlertStream';
import { useAuth } from './useAuth';
import { useConnection } from '../context/ConnectionContext';

interface UseAlertsResult {
  alerts:  Alert[];
  loading: boolean;
  error:   string | null;
}

const MAX_ALERTS = 100;

/**
 * Custom hook for managing alert state.
 * Responsible for initial loading of historical data via REST API
 * and automatic list updates when new events arrive via WebSocket.
 * @returns Object with alert list, loading state, and possible errors.
 */
export function useAlerts(): UseAlertsResult {
  const { user } = useAuth();
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const { isOnline } = useConnection();
  const previousIsOnline = useRef(true);
  const isInitialMount = useRef(true);

  const fetchAlerts = () => {
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
  };

  useEffect(() => {
    fetchAlerts();
  }, [user]);

  // Rehydrate data when connection is restored (false -> true transition)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!previousIsOnline.current && isOnline) {
      console.log('Connection restored, rehydrating alerts data');
      fetchAlerts();
    }

    previousIsOnline.current = isOnline;
  }, [isOnline]);

  const handleNewAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => {
      if (prev.some((a) => a.id === alert.id)) return prev;
      return [alert, ...prev].slice(0, MAX_ALERTS);
    });
  }, []);

  useAlertStream({ onAlert: handleNewAlert });

  return { alerts, loading, error };
}