import { useState, useEffect, useCallback } from 'react';
import { getIncidents } from '../services/incidentsService';
import { useIncidentStream } from './useIncidentStream';
import type { IncidentMarker } from '../types/incidents';

interface UseIncidentsResult {
  incidents: IncidentMarker[];
  loading:   boolean;
  error:     string | null;
}

const MAX_INCIDENTS = 500;

export function useIncidents(): UseIncidentsResult {
  const [incidents, setIncidents] = useState<IncidentMarker[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const handleNewIncident = useCallback((newIncident: IncidentMarker) => {
    setIncidents((prev) => {
      const index = prev.findIndex((inc) => inc.id === newIncident.id);
      if (index !== -1) {
        // Оновлюємо існуючий інцидент
        const updated = [...prev];
        updated[index] = newIncident;
        return updated;
      } else {
        // Додаємо новий та зберігаємо лише останні MAX_INCIDENTS
        return [...prev, newIncident].slice(-MAX_INCIDENTS);
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    getIncidents()
      .then((data) => { if (!cancelled){
        const activeOnly = data.filter(inc => inc.status !== 'Resolved');
        setIncidents(activeOnly); 
      } })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  useIncidentStream({ onIncident: handleNewIncident });

  return { incidents, loading, error };
}