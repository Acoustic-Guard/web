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
<<<<<<< HEAD
}

export async function updateIncidentStatus(id: string, status: string): Promise<void> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return;
  }

  const res = await fetchWithAuth(`${ENDPOINTS.incidents}/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(status),
  });

  if (!res.ok) throw new Error(`Status update failed: ${res.status}`);
=======

>>>>>>> 766fb1d5eaa99063e340f60fbd8cd47981197685
}