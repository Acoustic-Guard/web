/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef} from 'react';

import { mapApiAlert, type ApiAlert } from '../types/api';
import { WS_TOPICS } from '../config/api';
import { ensureConnected, getStompClient } from '../services/stompClient';
import type { Alert } from '../types/incidents';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

interface UseAlertStreamOptions {
  onAlert: (alert: Alert) => void;
}

/**
 * Хук для встановлення та підтримки WebSocket (STOMP) з'єднання для отримання 
 * потоку попереджень у реальному часі. Автоматично керує підпискою та відпискою 
 * при монтуванні/розмонтуванні компонента.
 * * @param options.onAlert - Коллбек, який викликається при отриманні нового попередження.
 */
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