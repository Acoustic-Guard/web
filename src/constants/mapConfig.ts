export const MAP_CONFIG = {
  center: [50.4501, 30.5234] as [number, number],
  defaultZoom: 12,
  tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  tileAttribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  maxZoom: 20,
} as const;

export const HEATMAP_CONFIG = {
  baseRadius: 60,
} as const;