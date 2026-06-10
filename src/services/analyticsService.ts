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

export async function getAnalytics(range: string = '24h', start?: string, end?: string): Promise<AnalyticsData> {
  let url = `${ENDPOINTS.analytics}`;
  
  if (range === 'custom' && start && end) {
    url += `?start=${start}T00:00:00Z&end=${end}T23:59:59Z`;
  } else {
    url += `?range=${range}`;
  }

  const res = await fetchWithAuth(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch analytics: ${res.status}`);
  }
  return res.json();
}