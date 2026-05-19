import { useEffect, useRef} from 'react';

import { mapApiAlert, type ApiAlert } from '../types/api';
import type { Alert } from '../types/incidents';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV;

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

    // TODO: STOMP — замінити на реальне підключення (інструкція вище)
    console.warn('[useAlertStream] WebSocket не підключено. IS_MOCK=false, але STOMP ще не реалізовано.');
  }, []); // залежностей немає — WS-з'єднання відкривається один раз
}