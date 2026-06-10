export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1',
  WS_URL: import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws/websocket',
} as const;

export const ENDPOINTS = {
  auth: '/auth/login',
  alerts: '/alerts',
  telemetry: '/telemetry',
  incidents: '/incidents',
  sensors: '/sensors',
  analytics: '/analytics',
  noiseMap: '/public/noise-map',
} as const;

export const WS_TOPICS = {
  alerts:    '/topic/alerts',
  incidents: '/topic/incidents',
  telemetry: '/topic/telemetry',
} as const;

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('jwt_token');
  
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
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