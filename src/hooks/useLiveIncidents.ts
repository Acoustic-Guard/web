/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useIncidents } from './useIncidents';
import { useIncidentStream } from './useIncidentStream';
import { updateIncidentStatus } from '../services/incidentsService';

export function useLiveIncidents() {
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [isResolving, setIsResolving] = useState(false);
  
  const { incidents: initialIncidents } = useIncidents();
  const [wsIncidents, setWsIncidents] = useState<any[]>([]);

  useIncidentStream({
    onIncident: (newIncident) => {
      if (resolvedIds.has(newIncident.id)) return;
      setWsIncidents((prev) => {
        const exists = prev.some((i) => i.id === newIncident.id);
        if (exists) return prev.map((i) => (i.id === newIncident.id ? newIncident : i));
        return [...prev, newIncident].slice(-500);
      });
      setSelectedIncident((current: any) => {
        if (current && current.id === newIncident.id) return newIncident;
        return current;
      });
    },
  });

  const liveIncidents = useMemo(() => {
    const merged = [...initialIncidents];
    wsIncidents.forEach((wsInc) => {
      const idx = merged.findIndex((i) => i.id === wsInc.id);
      if (idx !== -1) merged[idx] = wsInc;
      else merged.push(wsInc);
    });
    return merged.filter((i) => !resolvedIds.has(i.id) && i.status !== 'Resolved');
  }, [initialIncidents, wsIncidents, resolvedIds]);

  const handleResolve = async () => {
    if (!selectedIncident) return;
    setIsResolving(true);
    try {
      await updateIncidentStatus(selectedIncident.id, 'RESOLVED');
      setResolvedIds((prev) => { const s = new Set(prev); s.add(selectedIncident.id); return s; });
      setSelectedIncident(null);
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Помилка при оновленні статусу інциденту');
    } finally {
      setIsResolving(false);
    }
  };

  return { liveIncidents, selectedIncident, setSelectedIncident, handleResolve, isResolving };
}