/**
 * Глобальна конфігурація базових адрес для REST API та WebSocket.
 * Використовує змінні середовища (Environment Variables) для гнучкого 
 * налаштування під різні оточення (development, production).
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1',
  WS_URL: import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws/websocket',
} as const;

/**
 * Централізований словник маршрутів (endpoints) до ресурсів API.
 */
export const ENDPOINTS = {
  auth: '/auth/login',
  alerts: '/alerts',
  telemetry: '/telemetry',
  incidents: '/incidents',
  sensors: '/sensors',
  analytics: '/analytics',
  noiseMap: '/public/noise-map',
} as const;

/**
 * Перелік брокерських топіків для підписки на події через STOMP/WebSocket.
 */
export const WS_TOPICS = {
  alerts:    '/topic/alerts',
  incidents: '/topic/incidents',
  telemetry: '/topic/telemetry',
  sensors:   '/topic/sensors',
} as const;

/**
 * Універсальна обгортка (interceptor) для виконання HTTP-запитів.
 * Автоматично інжектує JWT-токен у заголовки (Bearer Auth) та забезпечує 
 * глобальну обробку помилок доступу (401/403), ініціюючи подію примусового виходу.
 * @param endpoint - Цільовий маршрут API.
 * @param options - Стандартні параметри конфігурації fetch.
 * @returns Promise з об'єктом Response.
 */
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

  if (response.status === 401 || response.status === 403) {
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  return response;
}