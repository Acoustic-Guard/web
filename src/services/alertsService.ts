import { API_CONFIG, ENDPOINTS } from '../config/api';
import { alerts } from '../mocks/incidentsMock';

import { mapApiAlert, type ApiAlert } from '../types/api';
import type { Alert } from '../types/incidents';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV;

// Коли з'явиться бекенд:
// 1. Встанови VITE_USE_MOCK=false у .env.production
// 2. Більше нічого не міняй — компоненти та хуки не знають про цей файл

export async function getAlerts(): Promise<Alert[]> {
  if (IS_MOCK) {
    // Симулюємо затримку мережі в dev-режимі
    await new Promise((r) => setTimeout(r, 300));
    return alerts;
  }

  const res = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.alerts}`);
  if (!res.ok) throw new Error(`Alerts fetch failed: ${res.status}`);

  const data: ApiAlert[] = await res.json();
  return data.map(mapApiAlert);
}