import { fetchWithAuth, ENDPOINTS } from '../config/api';

export interface ThreatDistribution {
  name: string;
  value: number;
}

export interface HistoricalIncident {
  datetime: string;
  type: string;
  coordinates: string;
  confidence: number;
  status: string;
}

export interface AnalyticsData {
  totalIncidents: number;
  activeAlerts: number;
  avgConfidence: number;
  criticalCount: number;
  threatDistribution: ThreatDistribution[];
  history: HistoricalIncident[];
}

export async function getAnalytics(range: string = '24h'): Promise<AnalyticsData> {
  const res = await fetchWithAuth(`${ENDPOINTS.analytics}?range=${range}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch analytics: ${res.status}`);
  }
  return res.json();
}