import { fetchWithAuth } from '../config/api';

export async function getHistoricalAnalytics(range: string) {
  const res = await fetchWithAuth(`/analytics?range=${range}`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}