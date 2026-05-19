import type { Alert } from '../types/incidents';
import type { IncidentMarker } from '../types/incidents';

// Tailwind CSS класи для бейджів у AlertFeed
export const THREAT_BADGE_COLORS: Record<Alert['type'], string> = {
  UAV:       'bg-red-500/10 text-red-400 border-red-500/20',
  Explosion: 'bg-red-500/10 text-red-400 border-red-500/20',
  Siren:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Generator: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

// Tailwind CSS класи для маркерів на карті (Leaflet divIcon)
export const MARKER_COLORS: Record<IncidentMarker['type'], string> = {
  UAV:       'bg-red-500',
  Explosion: 'bg-red-600',
  Siren:     'bg-amber-500',
  Generator: 'bg-yellow-500',
};

// RGB-рядки для Canvas-градієнтів теплової карти
export const HEATMAP_RGB: Record<IncidentMarker['type'], string> = {
  UAV:       '239, 68, 68',   // red-500
  Explosion: '239, 68, 68',   // red-500
  Siren:     '245, 158, 11',  // amber-500
  Generator: '234, 179, 8',   // yellow-500
};

// Колір тексту відсотка впевненості залежно від порогу
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-red-400';
  if (confidence >= 0.6) return 'text-amber-400';
  return 'text-yellow-400';
}