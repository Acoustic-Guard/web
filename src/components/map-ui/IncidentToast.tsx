import { useEffect, useRef } from 'react';
import { X, AlertTriangle, Radio, Zap, Wind, Truck } from 'lucide-react';
import type { ToastIncident } from '../../hooks/useNearbyIncidentToast';

interface Props {
  toast: ToastIncident | null;
  onDismiss: () => void;
}
/**
 * Словник налаштувань для спливаючих повідомлень (Toast).
 * Кольори синхронізовано з ThreatColors.ts (БПЛА = фіолетовий, Генератори = синій).
 */
const TYPE_CONFIG = {
  UAV:       { icon: Wind,          label: 'UAV detected',      color: 'text-red-400',    border: 'border-red-500/40',    bg: 'bg-red-500/10',    dot: 'bg-red-400',    bar: '#ef4444' },
  Explosion: { icon: Zap,           label: 'Explosion detected',  color: 'text-red-400',    border: 'border-red-500/40',    bg: 'bg-red-500/10',    dot: 'bg-red-400',    bar: '#ef4444' },
  Siren:     { icon: AlertTriangle, label: 'Siren activated',  color: 'text-amber-400',  border: 'border-amber-500/40',  bg: 'bg-amber-500/10',  dot: 'bg-amber-400',  bar: '#f59e0b' },
  Generator: { icon: Radio,         label: 'Generator detected', color: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-500/5',  dot: 'bg-yellow-400', bar: '#eab308' },
  Truck:     { icon: Truck,         label: 'Truck detected', color: 'text-blue-400',   border: 'border-blue-500/40',  bg: 'bg-blue-500/10',  dot: 'bg-blue-400',  bar: '#3b82f6' },
} as const;

const DURATION_MS = 6000;

/**
 * Спливаюче попередження про небезпеку поблизу користувача.
 * З'являється знизу екрана і має анімовану смужку прогресу (Таймбар).
 */
export function IncidentToast({ toast, onDismiss }: Props) {
  const barRef       = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef       = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const bar       = barRef.current;
    if (!container || !bar) return;

    // Скидаємо попередній таймер
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (rafRef.current)      cancelAnimationFrame(rafRef.current);

    if (!toast) {
      // Ховаємо через DOM напряму — без setState
      container.style.opacity  = '0';
      container.style.transform = 'translateY(12px)';
      return;
    }

    // Показуємо через DOM
    bar.style.width = '100%';
    container.style.opacity   = '0';
    container.style.transform = 'translateY(12px)';

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        container.style.opacity   = '1';
        container.style.transform = 'translateY(0)';
      });
    });

    // Таймбар через DOM
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed   = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DURATION_MS) * 100);
      if (bar) bar.style.width = `${remaining}%`;
      if (remaining === 0 && intervalRef.current) clearInterval(intervalRef.current);
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (rafRef.current)      cancelAnimationFrame(rafRef.current);
    };
  }, [toast?.id, toast]);

  if (!toast) return null;

  const cfg  = TYPE_CONFIG[toast.type];
  const Icon = cfg.icon;
  const distStr = toast.distanceKm < 1
    ? `${Math.round(toast.distanceKm * 1000)} m from you`
    : `${toast.distanceKm.toFixed(1)} km from you`;

  return (
    <div
      ref={containerRef}
      style={{
        opacity: 0,
        transform: 'translateY(12px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
      className={`absolute bottom-30 right-4 z-[700] w-85 bg-[#0a0a0f]/95 backdrop-blur-md border ${cfg.border} ${cfg.bg} rounded-xl shadow-2xl overflow-hidden`}
    >
      {/* Таймбар */}
      <div className="h-0.5 w-full bg-[#1a1a24]">
        <div
          ref={barRef}
          style={{ width: '100%', backgroundColor: cfg.bar, transition: 'width 0.05s linear' }}
          className="h-full"
        />
      </div>

      <div className="p-2">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg bg-[#1a1a24] border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
            <Icon size={15} className={cfg.color} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse flex-shrink-0`} />
              <p className={`text-xs font-semibold ${cfg.color} uppercase tracking-wide`}>{cfg.label}</p>
            </div>
            <p className="text-[#a1a1aa] text-[11px]">{distStr}</p>
          </div>

          <button onClick={onDismiss} className="text-[#52525b] hover:text-white transition-colors flex-shrink-0 mt-0.5">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}