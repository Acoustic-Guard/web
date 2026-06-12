/**
 * Глобальна конфігурація для ініціалізації базової мапи Leaflet.
 * Задає координати центру (Київ), початковий зум та джерело тайлів (CartoDB Dark).
 */
export const MAP_CONFIG = {
  center: [50.4501, 30.5234] as [number, number],
  defaultZoom: 12,
  tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  tileAttribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  maxZoom: 20,
} as const;

/**
 * Базові налаштування для рендерингу теплової карти (Heatmap).
 */
export const HEATMAP_CONFIG = {
  baseRadius: 60,
} as const;