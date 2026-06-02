import { fetchWithAuth, ENDPOINTS } from '../config/api';
import { alerts } from '../mocks/incidentsMock';
import { mapApiAlert, type ApiAlert } from '../types/api';
import type { Alert } from '../types/incidents';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export async function getAlerts(): Promise<Alert[]> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return alerts;
  }

  const res = await fetchWithAuth(ENDPOINTS.alerts);
  if (!res.ok) throw new Error(`Alerts fetch failed: ${res.status}`);

  const data: ApiAlert[] = await res.json();
  return data.map(mapApiAlert);
}