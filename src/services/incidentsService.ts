import { API_CONFIG, ENDPOINTS } from '../api';
import { incidents as mockIncidents } from '../mocks/incidentsMock';
import { mapApiIncident, type ApiIncident } from '../types/api';
import type { IncidentMarker } from '../types/incidents';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV;

export async function getIncidents(): Promise<IncidentMarker[]> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return mockIncidents;
  }

  const res = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.incidents}`);
  if (!res.ok) throw new Error(`Incidents fetch failed: ${res.status}`);

  const data: ApiIncident[] = await res.json();
  return data.map(mapApiIncident);
}