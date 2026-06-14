import { Radio, Zap, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTelemetry } from '../hooks/useTelemetry';
import type { MetricCardProps } from '../types/telemetry';

const METRIC_ICONS: LucideIcon[] = [Radio, Zap, Activity];

type Status = 'normal' | 'warning' | 'critical';

const STATUS_TEXT: Record<Status, string> = {
  normal:   'bg-emerald-500/10 text-emerald-400',
  warning:  'bg-amber-500/10 text-amber-400',
  critical: 'bg-red-500/10 text-red-400',
};
const STATUS_VALUE: Record<Status, string> = {
  normal:   'text-emerald-400',
  warning:  'text-amber-400',
  critical: 'text-red-400',
};

/**
 * Картка окремої системної метрики (наприклад, Заряд батареї або Сигнал).
 * Змінює колір індикатора залежно від статусу (normal, warning, critical).
 */
function MetricCard({ icon, label, value, unit, status = 'normal' }: MetricCardProps) {
  const displayValue = value ?? 0;
  return (
    <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="text-[#71717a]">{icon}</div>
        <div className={`text-xs px-2 py-0.5 rounded ${STATUS_TEXT[status]}`}>
          {status.toUpperCase()}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-semibold ${STATUS_VALUE[status]}`}>{displayValue}</span>
        {unit && <span className="text-sm text-[#71717a]">{unit}</span>}
      </div>
      <div className="text-xs text-[#71717a] mt-1">{label}</div>
    </div>
  );
}

/**
 * Віджет системної телеметрії (Верхня панель дашборду).
 * Отримує дані стану обладнання та відображає їх у вигляді сітки карток (MetricCard).
 */
export function TelemetryWidgets() {
  const { metrics, loading, error } = useTelemetry();

  if (loading) return (
    <div className="px-6 py-4 border-b border-[#1a1a24] text-xs text-[#71717a]">
      Завантаження телеметрії...
    </div>
  );

  if (error) return (
    <div className="px-6 py-4 border-b border-[#1a1a24] text-xs text-red-400">
      Помилка: {error}
    </div>
  );

  if (!metrics || metrics.length === 0) return (
    <div className="px-6 py-4 border-b border-[#1a1a24] text-xs text-[#71717a]">
      Немає даних телеметрії
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-[#1a1a24]">
      {metrics.map((metric, i) => {
        const Icon = METRIC_ICONS[i];
        return (
          <MetricCard
            key={metric.label}
            icon={<Icon size={16} />}
            label={metric.label}
            value={metric.value}
            unit={metric.unit}
            status={metric.status}
          />
        );
      })}
    </div>
  );
}