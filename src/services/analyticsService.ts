import { fetchWithAuth, ENDPOINTS } from '../config/api';

/**
 * Модель розподілу загроз за їх типом для графіків.
 */
export interface ThreatDistribution {
  name: string;
  value: number;
}

/**
 * Модель історичного запису інциденту для таблиць та аналітики.
 */
export interface HistoricalIncident {
  id: string;
  type: string;
  intensity: number;
  status: string;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Точка часового ряду для відображення динаміки загроз у часі.
 */
export interface TimeSeriesPoint {
  timestamp: string;
  UAV: number;
  Explosion: number;
  Siren: number;
  Generator: number;
}

/**
 * Комплексна модель аналітичних даних для дашборду.
 */
export interface AnalyticsData {
  totalIncidents: number;
  activeAlerts: number;
  avgConfidence: number;
  criticalCount: number;
  threatDistribution: ThreatDistribution[];
  history: HistoricalIncident[];
  timeSeries: TimeSeriesPoint[];
}

/**
 * Завантажує агреговані аналітичні дані за вказаний період.
 * @param range - Період (наприклад, '24h', '7d', 'custom').
 * @param start - Початкова дата (для 'custom' періоду).
 * @param end - Кінцева дата (для 'custom' періоду).
 * @returns Об'єкт AnalyticsData з метриками та масивами для графіків.
 */
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