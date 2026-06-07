import { fetchWithAuth, ENDPOINTS } from '../config/api';
import { incidents as mockIncidents } from '../mocks/incidentsMock';
import { mapApiIncident, type ApiIncident } from '../types/api';
import type { IncidentMarker } from '../types/incidents';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export async function getIncidents(): Promise<IncidentMarker[]> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return mockIncidents;
  }

  const res = await fetchWithAuth(ENDPOINTS.incidents);
  if (!res.ok) throw new Error(`Incidents fetch failed: ${res.status}`);

  const data: ApiIncident[] = await res.json();
  return data.map(mapApiIncident);
}

export async function updateIncidentStatus(id: string, status: string): Promise<void> {
  const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
  if (IS_MOCK) return;

  const res = await fetchWithAuth(`${ENDPOINTS.incidents}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'text/plain' },
    body: status,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Помилка сервера ${res.status}: ${errorText}`);
  }
}