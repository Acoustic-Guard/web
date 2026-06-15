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

/**
 * Виконує HTTP-запит з автоматичним повторенням при помилках мережі або серверних помилках (502/503).
 * Використовує експоненціальне відкладення між спробами.
 * @param endpoint - Цільовий маршрут API.
 * @param options - Стандартні параметри конфігурації fetch.
 * @param maxRetries - Максимальна кількість спроб повторення (за замовчуванням 3).
 * @returns Promise з об'єктом Response.
 */
export async function fetchWithRetry(
  endpoint: string, 
  options: RequestInit = {}, 
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;
  const INITIAL_DELAY = 1000; // 1 second
  const MAX_DELAY = 10000; // 10 seconds

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithAuth(endpoint, options);
      
      // Check if response is successful
      if (response.ok) {
        return response;
      }
      
      // Don't retry on client errors (4xx) except 408 Request Timeout
      if (response.status >= 400 && response.status < 500 && response.status !== 408) {
        return response;
      }
      
      // Retry on server errors (5xx) and network errors
      if (attempt < maxRetries) {
        const delay = Math.min(INITIAL_DELAY * Math.pow(2, attempt), MAX_DELAY);
        console.warn(`[API] Request failed with status ${response.status}, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      lastError = error as Error;
      
      // Retry on network errors
      if (attempt < maxRetries) {
        const delay = Math.min(INITIAL_DELAY * Math.pow(2, attempt), MAX_DELAY);
        console.warn(`[API] Network error, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed, throw the last error
  throw lastError || new Error('Max retries exceeded');
}