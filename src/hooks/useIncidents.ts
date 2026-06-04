import { useState, useEffect, useCallback } from 'react';
import { getIncidents } from '../services/incidentsService';
import { useIncidentStream } from './useIncidentStream';
import type { IncidentMarker } from '../types/incidents';
import { useAuth } from './useAuth';

interface UseIncidentsResult {
  incidents: IncidentMarker[];
  loading:   boolean;
  error:     string | null;
}

const MAX_INCIDENTS = 500;

export function useIncidents(): UseIncidentsResult {
  const { user } = useAuth();
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

    getIncidents()
      .then((data) => { if (!cancelled){
        const activeOnly = data.filter(inc => inc.status !== 'Resolved');
        setIncidents(activeOnly); 
        setError(null);
      } })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [user]);

  useIncidentStream({ onIncident: handleNewIncident });

  return { incidents, loading, error };
}