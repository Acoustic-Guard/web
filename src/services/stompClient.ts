import { Client } from '@stomp/stompjs';
import { API_CONFIG } from '../config/api';

let stompClient: Client | null = null;
let connectionPromise: Promise<void> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 10000; // 10 seconds max delay
const INITIAL_RECONNECT_DELAY = 1000; // 1 second initial delay

/**
 * Ініціалізує або повертає існуючий екземпляр STOMP клієнта для WebSocket з'єднання.
 * Автоматично додає JWT токен до заголовків підключення та налаштовує автоматичне перепідключення.
 * @returns Екземпляр Client від @stomp/stompjs.
 */
export function getStompClient(): Client {
  if (!stompClient) {
    const token = localStorage.getItem('jwt_token');
    
    stompClient = new Client({
      brokerURL: API_CONFIG.WS_URL,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: INITIAL_RECONNECT_DELAY,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onStompError: (frame) => {
        console.error('[STOMP] Broker reported error: ' + frame.headers['message']);
        console.error('[STOMP] Additional details: ' + frame.body);
      },
      onDisconnect: () => {
        console.log('[STOMP] Disconnected');
        reconnectAttempts = 0;
      },
      onWebSocketClose: () => {
        console.log('[STOMP] WebSocket closed, attempting to reconnect...');
        connectionPromise = null;
      },
      onWebSocketError: (error) => {
        console.error('[STOMP] WebSocket error:', error);
      },
    });
  }

  return stompClient;
}

/**
 * Обчислює затримку для експоненціального відкладення перепідключення.
 * @returns Затримка в мілісекундах.
 */
function getReconnectDelay(): number {
  const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  reconnectAttempts++;
  return delay;
}

/**
 * Забезпечує активне з'єднання WebSocket з автоматичним перепідключенням.
 * Якщо підключення в процесі, повертає існуючий Promise.
 * @returns Promise, який вирішується після успішного підключення.
 */
export async function ensureConnected(): Promise<void> {
  const client = getStompClient();
  
  if (client.connected) {
    reconnectAttempts = 0;
    return Promise.resolve();
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = new Promise((resolve, reject) => {
    const attemptConnection = () => {
      client.onConnect = () => {
        console.log('[STOMP] Connected');
        connectionPromise = null;
        reconnectAttempts = 0;
        resolve();
      };

      client.onWebSocketClose = () => {
        console.log('[STOMP] WebSocket closed');
        connectionPromise = null;
        
        // Attempt reconnection with exponential backoff
        const delay = getReconnectDelay();
        console.log(`[STOMP] Reconnecting in ${delay}ms... (attempt ${reconnectAttempts})`);
        setTimeout(attemptConnection, delay);
      };

      client.onWebSocketError = (error) => {
        console.error('[STOMP] WebSocket error:', error);
        connectionPromise = null;
        
        // Attempt reconnection with exponential backoff
        const delay = getReconnectDelay();
        console.log(`[STOMP] Reconnecting in ${delay}ms... (attempt ${reconnectAttempts})`);
        setTimeout(attemptConnection, delay);
      };

      client.activate();
    };

    attemptConnection();
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
    reconnectAttempts = 0;
  }
}
