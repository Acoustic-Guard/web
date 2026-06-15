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
 * on component mount/unmount.
 * @param options.onAlert - Callback that is called when a new alert is received.
 */
export function useAlertStream({ onAlert }: UseAlertStreamOptions) {
  const onAlertRef = useRef(onAlert);
  const { isOnline } = useConnection();
  
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
      // Cleanup subscription when offline
      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
      };
    }

    ensureConnected().then(() => {
      const client = getStompClient();
      console.log('[useAlertStream] Connected to STOMP');
      
      subscriptionRef.current = client.subscribe(WS_TOPICS.alerts, (message) => {
        const raw: ApiAlert = JSON.parse(message.body);
        onAlertRef.current(mapApiAlert(raw));
      });
    }).catch((err) => {
      console.error('[useAlertStream] Failed to connect:', err);
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [isOnline]);
}