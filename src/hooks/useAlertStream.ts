import { useEffect, useRef} from 'react';

import { mapApiAlert, type ApiAlert } from '../types/api';
import { WS_TOPICS } from '../config/api';
import { ensureConnected, getStompClient } from '../services/stompClient';
import type { Alert } from '../types/incidents';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

interface UseAlertStreamOptions {
  onAlert: (alert: Alert) => void;
}

// ─── Як підключити реальний WebSocket (STOMP / Spring Boot) ──────────────────
//
// 1. Встанови бібліотеку:
//    npm install @stomp/stompjs
//
// 2. Заміни секцію "// TODO: STOMP" нижче на:
//
//    import { Client } from '@stomp/stompjs';
//
//    const client = new Client({
//      brokerURL: API_CONFIG.WS_URL,
//      onConnect: () => {
//        client.subscribe(WS_TOPICS.alerts, (message) => {
//          const raw: ApiAlert = JSON.parse(message.body);
//          onAlert(mapApiAlert(raw));
//        });
//      },
//    });
//    client.activate();
//    return () => client.deactivate();
//
// ─────────────────────────────────────────────────────────────────────────────

export function useAlertStream({ onAlert }: UseAlertStreamOptions) {
  const onAlertRef = useRef(onAlert);
  
  useEffect(() => {
    onAlertRef.current = onAlert;
  }, [onAlert]);

  useEffect(() => {
    if (IS_MOCK) {
      // Заглушка: емулює новий алерт кожні 8 секунд
      const MOCK_TYPES = ['UAV', 'Explosion', 'Siren', 'Generator'] as const;
      const interval = setInterval(() => {
        const mockRaw: ApiAlert = {
          id:         crypto.randomUUID(),
          threatType: MOCK_TYPES[Math.floor(Math.random() * MOCK_TYPES.length)],
          confidence: parseFloat((0.6 + Math.random() * 0.4).toFixed(2)),
          location:   'Симульована локація',
          detectedAt: new Date().toISOString(),
        };
        onAlertRef.current(mapApiAlert(mockRaw));
      }, 8000);

      return () => clearInterval(interval);
    }

    const subscriptionRef = { current: null as any };

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
  }, []); // залежностей немає — WS-з'єднання відкривається один раз
}