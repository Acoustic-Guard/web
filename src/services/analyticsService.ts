import { fetchWithAuth, ENDPOINTS } from '../config/api';

export interface ThreatDistribution {
  name: string;
  value: number;
}

export interface HistoricalIncident {
  id: string;
  type: string;
  intensity: number;
  status: string;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
}

export interface TimeSeriesPoint {
  timestamp: string;
  UAV: number;
  Explosion: number;
  Siren: number;
  Generator: number;
}

export interface AnalyticsData {
  totalIncidents: number;
  activeAlerts: number;
  avgConfidence: number;
  criticalCount: number;
  threatDistribution: ThreatDistribution[];
  history: HistoricalIncident[];
  timeSeries: TimeSeriesPoint[];
}

export async function getAnalytics(range: string = '24h'): Promise<AnalyticsData> {
  const res = await fetchWithAuth(`${ENDPOINTS.analytics}?range=${range}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch analytics: ${res.status}`);
  }
  return res.json();
}