/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef} from 'react';

import { mapApiAlert, type ApiAlert } from '../types/api';
import { WS_TOPICS } from '../config/api';
import { ensureConnected, getStompClient } from '../services/stompClient';
import type { Alert } from '../types/incidents';
import { useConnection } from '../context/ConnectionContext';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

interface UseAlertStreamOptions {
  onAlert: (alert: Alert) => void;
}

/**
 * Hook for establishing and maintaining WebSocket (STOMP) connection for receiving
 * real-time alert stream. Automatically manages subscription and unsubscription
 * on component mount/unmount. Implements message batching to prevent UI freeze
 * during high-frequency message floods.
 * @param options.onAlert - Callback that is called when a new alert is received.
 */
export function useAlertStream({ onAlert }: UseAlertStreamOptions) {
  const onAlertRef = useRef(onAlert);
  const { isOnline } = useConnection();
  
  // Buffer for incoming messages to prevent UI freeze
  const messageBuffer = useRef<Alert[]>([]);
  const flushIntervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    onAlertRef.current = onAlert;
  }, [onAlert]);

  useEffect(() => {
    if (IS_MOCK) {
      // Mock: simulates a new alert every 8 seconds
      const MOCK_TYPES = ['UAV', 'Explosion', 'Siren', 'Generator', 'Truck'] as const;
      const interval = setInterval(() => {
        const mockRaw: ApiAlert = {
          id:         crypto.randomUUID(),
          threatType: MOCK_TYPES[Math.floor(Math.random() * MOCK_TYPES.length)],
          confidence: parseFloat((0.6 + Math.random() * 0.4).toFixed(2)),
          location:   'Simulated location',
          detectedAt: new Date().toISOString(),
        };
        onAlertRef.current(mapApiAlert(mockRaw));
      }, 8000);

      return () => clearInterval(interval);
    }

    const subscriptionRef = { current: null as any };

    if (!isOnline) {
      // Cleanup subscription and flush interval when offline
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
      messageBuffer.current = [];
      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
      };
    }

    // Flush buffer every 300ms to prevent UI freeze
    flushIntervalRef.current = window.setInterval(() => {
      if (messageBuffer.current.length > 0) {
        // Process buffered messages in batch
        const alertsToProcess = messageBuffer.current;
        messageBuffer.current = [];
        
        // Keep only latest 200 alerts to prevent DOM bloat
        alertsToProcess.slice(-200).forEach(alert => {
          onAlertRef.current(alert);
        });
      }
    }, 300);

    ensureConnected().then(() => {
      const client = getStompClient();
      console.log('[useAlertStream] Connected to STOMP');
      
      subscriptionRef.current = client.subscribe(WS_TOPICS.alerts, (message) => {
        const raw: ApiAlert = JSON.parse(message.body);
        const alert = mapApiAlert(raw);
        
        // Push to buffer instead of calling state setter directly
        messageBuffer.current.push(alert);
      });
    }).catch((err) => {
      console.error('[useAlertStream] Failed to connect:', err);
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
      messageBuffer.current = [];
    };
  }, [isOnline]);
}