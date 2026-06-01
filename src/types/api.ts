import type { Alert, IncidentMarker } from './incidents';
import type { MetricCardProps } from './telemetry';

export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080',
  WS_URL: 'ws://localhost:8080/ws',
};

export const ENDPOINTS = {
  auth: '/api/auth/login',
  alerts: '/api/alerts',
  telemetry: '/api/v1/telemetry',
  incidents: '/api/incidents',
};

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('jwt_token');
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    window.location.href = '/';
  }

  return response;
}

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