import type { Alert, IncidentMarker } from './incidents';
import type { MetricCardProps } from './telemetry';

// ─── Типи, які поверне бекенд (Java DTO → JSON) ───────────────────────────────
// Якщо бекенд змінить поле — виправляємо тут і в mapper'і, компоненти не чіпаємо.

export interface ApiAlert {
  id:         string;
  threatType: string;       // бекенд може використовувати threatType замість type
  confidence: number;
  location:   string;
  detectedAt: string;       // ISO 8601, наприклад "2024-01-15T14:32:00Z"
}

export interface ApiIncident {
  id:        string;
  latitude:  number;
  longitude: number;
  type:      string;
  intensity: number;
}

export interface ApiTelemetry {
  activeNodes:    number;
  avgLatencyMs:   number;
  noiseLevelDb:   number;
  nodesStatus:    'normal' | 'warning' | 'critical';
  latencyStatus:  'normal' | 'warning' | 'critical';
  noiseStatus:    'normal' | 'warning' | 'critical';
}

// ─── Mapper'и: ApiТип → внутрішній тип фронту ────────────────────────────────

export function mapApiAlert(raw: ApiAlert): Alert {
  return {
    id:         raw.id,
    type:       raw.threatType as Alert['type'],
    confidence: raw.confidence,
    location:   raw.location,
    timestamp:  new Date(raw.detectedAt).toLocaleTimeString('uk-UA'),
  };
}

export function mapApiIncident(raw: ApiIncident): IncidentMarker {
  return {
    id:        raw.id,
    lat:       raw.latitude,
    lng:       raw.longitude,
    type:      raw.type as IncidentMarker['type'],
    intensity: raw.intensity,
  };
}

export function mapApiTelemetry(raw: ApiTelemetry): MetricCardProps[] {
  return [
    { label: 'Active Sensor Nodes',    value: raw.activeNodes,  unit: 'nodes', status: raw.nodesStatus,   icon: null },
    { label: 'Avg. System Latency',    value: raw.avgLatencyMs, unit: 'ms',    status: raw.latencyStatus, icon: null },
    { label: 'Background Noise Level', value: raw.noiseLevelDb, unit: 'dB',    status: raw.noiseStatus,   icon: null },
  ];
}