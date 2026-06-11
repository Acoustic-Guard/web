import * as turf from '@turf/turf';

export const ZONE_DEG = 0.045;

export function dbToColor(db: number): string {
  if (db >= 75) return '#ef4444';
  if (db >= 65) return '#f97316';
  if (db >= 55) return '#eab308';
  if (db >= 45) return '#3b82f6';
  return '#22c55e';
}

export function dbToOpacity(db: number): number {
  // Higher minimum opacity for low dB values to match legend brightness
  const minOpacity = db < 45 ? 0.65 : 0.35;
  return Math.min(0.85, minOpacity + ((db - 30) / 55) * 0.5);
}

export function idwInterpolate(
  hexCenterLng: number,
  hexCenterLat: number,
  noisePoints: { latitude: number; longitude: number; db: number }[],
  influenceRadiusKm = 2.5,
  p = 2,
  baseDb = 38
): number {
  if (!noisePoints.length) return baseDb;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const pt of noisePoints) {
    const distKm = turf.distance(
      turf.point([hexCenterLng, hexCenterLat]),
      turf.point([pt.longitude, pt.latitude]),
      { units: 'kilometers' }
    );

    if (distKm > influenceRadiusKm) continue;

    if (distKm < 0.001) return pt.db;

    const w = 1 / Math.pow(distKm, p);
    weightedSum += w * pt.db;
    totalWeight += w;
  }

  if (totalWeight === 0) return baseDb;
  return weightedSum / totalWeight;
}

export function intensityToRgb(intensity: number): string {
  if (intensity >= 0.8) return '239,68,68';
  if (intensity >= 0.6) return '249,115,22';
  if (intensity >= 0.4) return '234,179,8';
  if (intensity >= 0.2) return '34,197,94';
  return '37,99,235';
}

