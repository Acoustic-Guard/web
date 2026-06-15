import { Client } from '@stomp/stompjs';
import { API_CONFIG } from '../config/api';

let stompClient: Client | null = null;
let connectionPromise: Promise<void> | null = null;
let reconnectAttempts = 0;
let offlineTimer: number | null = null;
let onOnlineCallback: (() => void) | null = null;
let onOfflineCallback: (() => void) | null = null;
const MAX_RECONNECT_DELAY = 10000; // 10 seconds max delay
const INITIAL_RECONNECT_DELAY = 1000; // 1 second initial delay
const OFFLINE_DEBOUNCE_MS = 5000; // 5 seconds before going offline

/**
 * Sets callbacks for connection state changes.
 * @param onOnline - Called when connection is established
 * @param onOffline - Called when connection is lost (after 5s debounce)
 */
export function setConnectionCallbacks(onOnline: () => void, onOffline: () => void): void {
  onOnlineCallback = onOnline;
  onOfflineCallback = onOffline;
}

/**
 * Clears the offline debounce timer.
 */
function clearOfflineTimer(): void {
  if (offlineTimer) {
    console.log('[STOMP] Clearing offline debounce timer');
    clearTimeout(offlineTimer);
    offlineTimer = null;
  }
}

/**
 * Starts the offline debounce timer.
 * If no reconnection occurs within 5 seconds, calls the offline callback.
 * Does NOT restart the timer if it's already running (prevents timer starvation).
 */
function startOfflineTimer(): void {
  // If timer is already running, don't reset it (prevents starvation)
  if (offlineTimer) {
    console.log('[STOMP] Offline timer already running, not resetting');
    return;
  }

  console.log('[STOMP] Starting 5-second offline debounce timer');
  offlineTimer = setTimeout(() => {
    console.log('[Timer] 5 seconds passed, setting offline state');
    offlineTimer = null;
    if (onOfflineCallback) {
      onOfflineCallback();
    }
  }, OFFLINE_DEBOUNCE_MS);
}

/**
 * Initializes or returns an existing STOMP client instance for WebSocket connection.
 * Automatically adds JWT token to connection headers and configures auto-reconnection.
 * @returns Client instance from @stomp/stompjs.
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
        startOfflineTimer();
      },
      onWebSocketError: (error) => {
        console.error('[STOMP] WebSocket error:', error);
        startOfflineTimer();
      },
    });
  }

  return stompClient;
}

/**
 * Calculates the delay for exponential backoff reconnection.
 * @returns Delay in milliseconds.
 */
function getReconnectDelay(): number {
  const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  reconnectAttempts++;
  return delay;
}

/**
 * Ensures active WebSocket connection with automatic reconnection.
 * If connection is in progress, returns the existing Promise.
 * @returns Promise that resolves after successful connection.
 */
export async function ensureConnected(): Promise<void> {
  const client = getStompClient();
  
  if (client.connected) {
    reconnectAttempts = 0;
    clearOfflineTimer();
    if (onOnlineCallback) {
      onOnlineCallback();
    }
    return Promise.resolve();
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = new Promise((resolve) => {
    const attemptConnection = () => {
      client.onConnect = () => {
        console.log('[STOMP] Connected');
        connectionPromise = null;
        reconnectAttempts = 0;
        clearOfflineTimer();
        if (onOnlineCallback) {
          onOnlineCallback();
        }
        resolve();
      };

      client.onWebSocketClose = () => {
        console.log('[STOMP] WebSocket closed');
        connectionPromise = null;
        startOfflineTimer();
        
        // Attempt reconnection with exponential backoff
        const delay = getReconnectDelay();
        console.log(`[STOMP] Reconnecting in ${delay}ms... (attempt ${reconnectAttempts})`);
        setTimeout(attemptConnection, delay);
      };

      client.onWebSocketError = (error) => {
        console.error('[STOMP] WebSocket error:', error);
        connectionPromise = null;
        startOfflineTimer();
        
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
 * Properly closes WebSocket connection and clears the client instance.
 */
export function disconnectStomp(): void {
  clearOfflineTimer();
  if (stompClient && stompClient.connected) {
    stompClient.deactivate();
    stompClient = null;
    connectionPromise = null;
    reconnectAttempts = 0;
  }
}
