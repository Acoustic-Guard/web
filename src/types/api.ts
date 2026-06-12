import type { Alert, IncidentMarker } from './incidents';
import type { MetricCardProps } from './telemetry';

/**
 * DTO для попередження про загрозу, отриманого з API.
 */
export interface ApiAlert {
  id:         string;
  threatType: string;
  confidence: number;
  location:   string;
  detectedAt: string;
}

/**
 * DTO для інциденту (наприклад, виявлення БПЛА чи вибуху), отриманого з API.
 */
export interface ApiIncident {
  id:        string;
  latitude:  number;
  longitude: number;
  type:      string;
  intensity: number;
  status:    string;
}

/**
 * DTO для телеметричних даних акустичних сенсорів, отриманого з API.
 */
export interface ApiTelemetry {
  activeNodes:    number;
  avgLatencyMs:   number;
  noiseLevelDb:   number;
  nodesStatus:    'normal' | 'warning' | 'critical';
  latencyStatus:  'normal' | 'warning' | 'critical';
  noiseStatus:    'normal' | 'warning' | 'critical';
}

/**
 * Перетворює DTO попередження на клієнтську модель Alert.
 * @param raw - Сирі дані з API.
 * @returns Форматований об'єкт Alert.
 */
export function mapApiAlert(raw: ApiAlert): Alert {
  return {
    id:         raw.id,
    type:       raw.threatType as Alert['type'],
    confidence: raw.confidence,
    location:   raw.location,
    timestamp:  new Date(raw.detectedAt).toLocaleTimeString('uk-UA'),
  };
}

/**
 * Перетворює DTO інциденту на маркер для мапи.
 * @param raw - Сирі дані з API.
 * @returns Форматований об'єкт IncidentMarker.
 */
export function mapApiIncident(raw: ApiIncident): IncidentMarker {
  return {
    id:        raw.id,
    lat:       raw.latitude,
    lng:       raw.longitude,
    type:      raw.type as IncidentMarker['type'],
    intensity: raw.intensity,
    status:    raw.status,
  };
}

/**
 * Перетворює DTO телеметрії на масив властивостей для карток метрик.
 * @param raw - Сирі дані з API.
 * @returns Масив MetricCardProps для UI.
 */
export function mapApiTelemetry(raw: ApiTelemetry): MetricCardProps[] {
  return [
    { label: 'Active Sensor Nodes',    value: raw.activeNodes ?? 0,  unit: 'nodes', status: raw.nodesStatus,   icon: null },
    { label: 'Avg. System Latency',    value: raw.avgLatencyMs ?? 0, unit: 'ms',    status: raw.latencyStatus, icon: null },
    { label: 'Background Noise Level', value: raw.noiseLevelDb ?? 0, unit: 'dB',    status: raw.noiseStatus,   icon: null },
  ];
}