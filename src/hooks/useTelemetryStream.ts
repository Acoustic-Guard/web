/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';

import { mapApiTelemetry, type ApiTelemetry } from '../types/api';
import { WS_TOPICS } from '../config/api';
import { ensureConnected, getStompClient } from '../services/stompClient';
import type { MetricCardProps } from '../types/telemetry';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Властивості конфігурації для підключення потоку телеметрії.
 * @param onTelemetry - Коллбек-функція, яка викликається при отриманні та успішному парсингу нових метрик.
 */
interface UseTelemetryStreamOptions {
  onTelemetry: (metrics: MetricCardProps[]) => void;
}

/**
 * Хук для встановлення STOMP-з'єднання та прослуховування потоку телеметрії у реальному часі.
 * Застосовує патерн збереження посилання (useRef) на коллбек, що дозволяє уникати 
 * зайвих перепідключень WebSocket при оновленні компонента. 
 * Забезпечує безпечний парсинг вхідних повідомлень (try/catch) та коректне 
 * звільнення ресурсів (unsubscribe) при розмонтуванні.
 */
export function useTelemetryStream({ onTelemetry }: UseTelemetryStreamOptions) {
  const onTelemetryRef = useRef(onTelemetry);
  
  useEffect(() => {
    onTelemetryRef.current = onTelemetry;
  }, [onTelemetry]);

  useEffect(() => {
    if (IS_MOCK) return;

    const subscriptionRef = { current: null as any };

    ensureConnected().then(() => {
      const client = getStompClient();
      console.log('[useTelemetryStream] Connected to STOMP');
      
      subscriptionRef.current = client.subscribe(WS_TOPICS.telemetry, (message) => {
        try {
          const raw: ApiTelemetry = JSON.parse(message.body);
          onTelemetryRef.current(mapApiTelemetry(raw));
        } catch (e) {
          console.error('[useTelemetryStream] Failed to parse telemetry', e);
        }
      });
    }).catch((err) => {
      console.error('[useTelemetryStream] Failed to connect:', err);
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []);
}