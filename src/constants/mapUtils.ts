import * as turf from '@turf/turf';

/**
 * Базовий крок у градусах для розрахунку географічної сітки або буферних зон.
 */
export const ZONE_DEG = 0.045;

/**
 * Зіставляє рівень шуму (дБ) з HEX-кольором для відображення інтенсивності на мапі.
 */
export function dbToColor(db: number): string {
  if (db >= 75) return '#ef4444';
  if (db >= 65) return '#f97316';
  if (db >= 55) return '#eab308';
  if (db >= 45) return '#3b82f6';
  return '#22c55e';
}

/**
 * Розраховує динамічну прозорість полігонів залежно від рівня шуму.
 * Забезпечує кращу видимість фонових елементів для зон з низьким рівнем шуму.
 */
export function dbToOpacity(db: number): number {
  // Higher minimum opacity for low dB values to match legend brightness
  const minOpacity = db < 45 ? 0.65 : 0.35;
  return Math.min(0.85, minOpacity + ((db - 30) / 55) * 0.5);
}

/**
 * Виконує просторову інтерполяцію методом обернених зважених відстаней (IDW).
 * Дозволяє оцінити рівень шуму в довільній точці мапи на основі показників 
 * найближчих реальних сенсорів, формуючи безперервне акустичне поле.
 * * @param hexCenterLng - Довгота цільової точки.
 * @param hexCenterLat - Широта цільової точки.
 * @param noisePoints - Масив доступних точок телеметрії з показниками дБ.
 * @param influenceRadiusKm - Максимальний радіус впливу сенсора у кілометрах.
 * @param p - Ступінь згасання (power parameter).
 * @param baseDb - Фоновий рівень шуму за замовчуванням.
 * @returns Обчислене значення шуму в децибелах.
 */
export function idwInterpolate(
  hexCenterLng: number,
  hexCenterLat: number,
  noisePoints: { latitude: number; longitude: number; db: number, type?: string }[],
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

    if (pt.type) {
      switch (pt.type.toUpperCase()) {
        case 'EXPLOSION':
          influenceRadiusKm = 8.0;
          p = 1.5;
          break;
        case 'SIREN':
          influenceRadiusKm = 3.0;
          p = 2.0;
          break;
        case 'UAV':
          influenceRadiusKm = 4.0;
          p = 2.0;
          break;
        case 'TRUCK':
          influenceRadiusKm = 1.5;
          p = 2.5;
          break;
        case 'GENERATOR':
          influenceRadiusKm = 0.5;
          p = 3.5;
          break;
      }
    }

    if (distKm > influenceRadiusKm) continue;

    if (distKm < 0.001) return pt.db;

    const w = 1 / Math.pow(distKm, p);
    weightedSum += w * pt.db;
    totalWeight += w;
  }

  if (totalWeight === 0) return baseDb;
  return weightedSum / totalWeight;
}

/**
 * Перетворює нормалізоване значення інтенсивності загрози на RGB-рядок 
 * для використання у Canvas API (наприклад, для радіальних градієнтів).
 */
export function intensityToRgb(intensity: number): string {
  if (intensity >= 0.8) return '239,68,68';
  if (intensity >= 0.6) return '249,115,22';
  if (intensity >= 0.4) return '234,179,8';
  if (intensity >= 0.2) return '34,197,94';
  return '37,99,235';
}

