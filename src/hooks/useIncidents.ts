import { useState, useEffect } from 'react';
import { getIncidents } from '../services/incidentsService';
import type { IncidentMarker } from '../types/incidents';

interface UseIncidentsResult {
  incidents: IncidentMarker[];
  loading:   boolean;
  error:     string | null;
}

export function useIncidents(): UseIncidentsResult {
  const [incidents, setIncidents] = useState<IncidentMarker[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getIncidents()
      .then((data) => { if (!cancelled) setIncidents(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  return { incidents, loading, error };
}