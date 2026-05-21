import { API_CONFIG, ENDPOINTS } from '../config/api';
import { mapApiTelemetry, type ApiTelemetry } from '../types/api';
import type { MetricCardProps } from '../types/telemetry';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV;

// Мок-дані прямо тут, бо telemetryMock.ts містить React-іконки
// і не може бути чистим дата-файлом
const mockTelemetry: ApiTelemetry = {
  activeNodes:   247,
  avgLatencyMs:  12,
  noiseLevelDb:  42,
  nodesStatus:   'normal',
  latencyStatus: 'normal',
  noiseStatus:   'normal',
};

export async function getTelemetry(): Promise<MetricCardProps[]> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return mapApiTelemetry(mockTelemetry);
  }

  const res = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.telemetry}`);
  if (!res.ok) throw new Error(`Telemetry fetch failed: ${res.status}`);

  const data: ApiTelemetry = await res.json();
  return mapApiTelemetry(data);
}