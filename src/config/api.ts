export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL ?? '',
  WS_URL:   import.meta.env.VITE_WS_URL ?? `ws://${window.location.host}/ws`,
} as const;

export const ENDPOINTS = {
  auth: '/api/auth/login',
  alerts: '/api/alerts',
  telemetry: '/api/telemetry',
  incidents: '/api/incidents',
} as const;

export const WS_TOPICS = {
  alerts:    '/topic/alerts',
  incidents: '/topic/incidents',
  telemetry: '/topic/telemetry',
} as const;

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