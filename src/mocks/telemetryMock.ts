import { Activity, Zap, Radio } from 'lucide-react';
import type { MetricCardProps } from '../types/telemetry';

// React-елементи не можна зберігати в чистому .ts,
// тому мок повертається як функція і використовується в компоненті.
// Якщо іконки будуть підключені через рядковий id — переробити на чистий об'єкт.
export function getTelemetryMetrics(): Omit<MetricCardProps, 'icon'>[] {
  return [
    { label: 'Active Sensor Nodes',   value: 247, unit: 'nodes', status: 'normal' },
    { label: 'Avg. System Latency',   value: 12,  unit: 'ms',    status: 'normal' },
    { label: 'Background Noise Level',value: 42,  unit: 'dB',    status: 'normal' },
  ];
}

export const TELEMETRY_ICONS = [Radio, Zap, Activity] as const;