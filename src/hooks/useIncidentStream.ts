/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef} from 'react';
import { mapApiIncident, type ApiIncident } from '../types/api';
import { WS_TOPICS } from '../config/api';
import { ensureConnected, getStompClient } from '../services/stompClient';
import type { IncidentMarker } from '../types/incidents';
import { useConnection } from '../context/ConnectionContext';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

interface UseIncidentStreamOptions {
  onIncident: (incident: IncidentMarker) => void;
}

/**
 * Maintains active STOMP connection for listening to new incidents
 * (e.g., UAV detection or explosions) in real-time from the backend.
 * Implements message batching to prevent UI freeze during high-frequency message floods.
 * @param options.onIncident - Callback for processing incoming incident DTO.
 */
export function useIncidentStream({ onIncident }: UseIncidentStreamOptions) {
  const onIncidentRef = useRef(onIncident);
  const { isOnline } = useConnection();
  
  // Buffer for incoming messages to prevent UI freeze
  const messageBuffer = useRef<IncidentMarker[]>([]);
  const flushIntervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    onIncidentRef.current = onIncident;
  }, [onIncident]);

  useEffect(() => {
    if (IS_MOCK) {
      const MOCK_TYPES = ['UAV', 'Explosion', 'Siren', 'Generator', 'Truck'] as const;
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
        const incidentsToProcess = messageBuffer.current;
        messageBuffer.current = [];
        
        // Keep only latest 200 incidents to prevent DOM bloat
        incidentsToProcess.slice(-200).forEach(incident => {
          onIncidentRef.current(incident);
        });
      }
    }, 300);

    ensureConnected().then(() => {
      const client = getStompClient();
      console.log('[useIncidentStream] Connected to STOMP');
      
      subscriptionRef.current = client.subscribe(WS_TOPICS.incidents, (message) => {
        const raw: ApiIncident = JSON.parse(message.body);
        const incident = mapApiIncident(raw);
        
        // Push to buffer instead of calling state setter directly
        messageBuffer.current.push(incident);
      });
    }).catch((err) => {
      console.error('[useIncidentStream] Failed to connect:', err);
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
