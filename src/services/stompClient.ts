import { Client } from '@stomp/stompjs';
import { API_CONFIG } from '../config/api';

let stompClient: Client | null = null;
let connectionPromise: Promise<void> | null = null;

/**
 * Ініціалізує або повертає існуючий екземпляр STOMP клієнта для WebSocket з'єднання.
 * Автоматично додає JWT токен до заголовків підключення.
 * @returns Екземпляр Client від @stomp/stompjs.
 */
export function getStompClient(): Client {
  if (!stompClient) {
    const token = localStorage.getItem('jwt_token');
    
    stompClient = new Client({
      brokerURL: API_CONFIG.WS_URL,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      onStompError: (frame) => {
        console.error('[STOMP] Broker reported error: ' + frame.headers['message']);
        console.error('[STOMP] Additional details: ' + frame.body);
      },
      onDisconnect: () => {
        console.log('[STOMP] Disconnected');
      },
    });
  }

  return stompClient;
}

/**
 * Забезпечує активне з'єднання WebSocket. Якщо підключення в процесі, повертає існуючий Promise.
 * @returns Promise, який вирішується після успішного підключення.
 */
export async function ensureConnected(): Promise<void> {
  const client = getStompClient();
  
  if (client.connected) {
    return Promise.resolve();
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = new Promise((resolve) => {
    client.onConnect = () => {
      console.log('[STOMP] Connected');
      connectionPromise = null;
      resolve();
    };

    client.onWebSocketClose = () => {
      console.log('[STOMP] WebSocket closed');
      connectionPromise = null;
    };

    client.activate();
  });

  return connectionPromise;
}

/**
 * Коректно закриває WebSocket з'єднання та очищує екземпляр клієнта.
 */
export function disconnectStomp(): void {
  if (stompClient && stompClient.connected) {
    stompClient.deactivate();
    stompClient = null;
    connectionPromise = null;
  }
}
