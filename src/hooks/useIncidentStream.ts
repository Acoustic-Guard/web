/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef} from 'react';
import { mapApiIncident, type ApiIncident } from '../types/api';
import { WS_TOPICS } from '../config/api';
import { ensureConnected, getStompClient } from '../services/stompClient';
import type { IncidentMarker } from '../types/incidents';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

interface UseIncidentStreamOptions {
  onIncident: (incident: IncidentMarker) => void;
}

/**
 * Підтримує активне STOMP-з'єднання для прослуховування нових інцидентів 
 * (наприклад, виявлення БПЛА чи вибухів) у реальному часі від бекенду.
 * * @param options.onIncident - Коллбек для обробки вхідного DTO інциденту.
 */
export function useIncidentStream({ onIncident }: UseIncidentStreamOptions) {
  const onIncidentRef = useRef(onIncident);
  
  useEffect(() => {
    onIncidentRef.current = onIncident;
  }, [onIncident]);

  useEffect(() => {
    if (IS_MOCK) {
      const MOCK_TYPES = ['UAV', 'Explosion', 'Siren', 'Generator'] as const;
      const interval = setInterval(() => {
        const mockRaw: ApiIncident = {
          id: crypto.randomUUID(),
          latitude: 48.5 + Math.random() * 2,
          longitude: 35.5 + Math.random() * 2,
          type: MOCK_TYPES[Math.floor(Math.random() * MOCK_TYPES.length)],
          intensity: parseFloat((0.3 + Math.random() * 0.7).toFixed(2)),
          status: 'Detected',
        };
        onIncidentRef.current(mapApiIncident(mockRaw));
      }, 12000);

      return () => clearInterval(interval);
    }

    const subscriptionRef = { current: null as any };

    ensureConnected().then(() => {
      const client = getStompClient();
      console.log('[useIncidentStream] Connected to STOMP');
      
      subscriptionRef.current = client.subscribe(WS_TOPICS.incidents, (message) => {
        const raw: ApiIncident = JSON.parse(message.body);
        onIncidentRef.current(mapApiIncident(raw));
      });
    }).catch((err) => {
      console.error('[useIncidentStream] Failed to connect:', err);
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []);
}
