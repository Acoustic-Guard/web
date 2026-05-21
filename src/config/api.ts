export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  WS_URL:   import.meta.env.VITE_WS_URL        ?? 'ws://localhost:8080/ws',
} as const;

export const ENDPOINTS = {
  alerts:    '/api/v1/alerts',
  incidents: '/api/v1/incidents',
  telemetry: '/api/v1/telemetry',
} as const;

export const WS_TOPICS = {
  alerts:    '/topic/alerts',
  incidents: '/topic/incidents',
  telemetry: '/topic/telemetry',
} as const;