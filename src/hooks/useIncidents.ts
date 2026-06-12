/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { getIncidents, getPublicIncidents } from '../services/incidentsService';
import { useIncidentStream } from './useIncidentStream';
import type { IncidentMarker } from '../types/incidents';
import { useAuth } from './useAuth';

interface UseIncidentsResult {
  incidents: IncidentMarker[];
  loading:   boolean;
  error:     string | null;
}

const MAX_INCIDENTS = 500;

/**
 * Хук для завантаження масиву зафіксованих інцидентів.
 * Використовує рольову модель доступу (RBAC): адміністратори отримують повні дані, 
 * гості — публічну версію. Інтегрує WebSocket-стрім для миттєвого оновлення статусу інцидентів.
 */
export function useIncidents(): UseIncidentsResult {
  const { isAdmin } = useAuth();
  const [incidents, setIncidents] = useState<IncidentMarker[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const handleNewIncident = useCallback((newIncident: IncidentMarker) => {
    setIncidents((prev) => {
      const index = prev.findIndex((inc) => inc.id === newIncident.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = newIncident;
        return updated;
      } else {
        return [...prev, newIncident].slice(-MAX_INCIDENTS);
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchMapData = async () => {
      setLoading(true); 
      
      try {
        const fetcher = isAdmin ? getIncidents : getPublicIncidents;
        const data = await fetcher();
        
        if (!cancelled) {
          const activeOnly = data.filter(inc => inc.status && inc.status.toUpperCase() !== 'RESOLVED');
          setIncidents(activeOnly);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.warn("Не вдалося завантажити інциденти:", err.message);
          setIncidents([]); 
          setError(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMapData();

    return () => { cancelled = true; };
  }, [isAdmin]);

  useIncidentStream({ onIncident: handleNewIncident });

  return { incidents, loading, error };
}