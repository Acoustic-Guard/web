import { useMemo } from 'react';
import { Wind, Zap, AlertTriangle, Radio, Clock, ChevronRight, Truck } from 'lucide-react';
import type { IncidentMarker } from '../types/incidents';

interface Props {
  incidents: IncidentMarker[];
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_CONFIG = {
  UAV:       { icon: Wind,          label: 'БПЛА',    color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
  Explosion: { icon: Zap,           label: 'Вибухи',  color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
  Siren:     { icon: AlertTriangle, label: 'Сирени',  color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20'  },
  Generator: { icon: Radio,         label: 'Генер.',  color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  Truck:     { icon: Truck,         label: 'Вантаж.', color: 'text-blue-400',   bg: 'bg-blue-500/10',  border: 'border-blue-500/20'   },
} as const;

export function IncidentStatsWidget({ incidents, isOpen, onClose }: Props) {
  const stats = useMemo(() => {
    const counts = { UAV: 0, Explosion: 0, Siren: 0, Generator: 0, Truck: 0 };
    for (const inc of incidents) {
      if (inc.type in counts) counts[inc.type]++;
    }
    const avgConfidence = incidents.length
      ? Math.round(incidents.reduce((s, i) => s + i.intensity, 0) / incidents.length * 100)
      : 0;
    return { counts, total: incidents.length, avgConfidence };
  }, [incidents]);

  return (
    <div
      className="absolute right-0 top-0 h-full z-[550] pointer-events-none"
    >
      {/* Панель */}
      <div
        className="pointer-events-auto h-full w-72 bg-[#0a0a0f]/95 backdrop-blur-md border-l border-[#1a1a24] flex flex-col shadow-2xl"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a24]">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[#71717a]" />
            <span className="text-xs font-semibold text-white">Активні інциденти</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#71717a] hover:text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Загальна статистика */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a24]">
          <div className="flex items-center gap-1.5 bg-[#1a1a24] rounded px-2.5 py-1">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-white font-mono">{stats.total}</span>
            <span className="text-[10px] text-[#71717a]">всього</span>
          </div>
          <span className="text-[10px] text-[#52525b]">
            Впевненість: <span className="text-white font-mono">{stats.avgConfidence}%</span>
          </span>
        </div>

        {/* Лічильники по типах */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map((type) => {
            const cfg   = TYPE_CONFIG[type];
            const Icon  = cfg.icon;
            const count = stats.counts[type];
            const pct   = stats.total > 0 ? (count / stats.total) * 100 : 0;

            return (
              <div key={type} className={`${cfg.bg} border ${cfg.border} rounded-lg p-3 flex flex-col gap-2`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={cfg.color} />
                    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <span className={`text-xl font-semibold font-mono ${count > 0 ? cfg.color : 'text-[#52525b]'}`}>
                    {count}
                  </span>
                </div>
                <div className="h-0.5 w-full bg-[#1a1a24] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      type === 'UAV' || type === 'Explosion' ? 'bg-red-500' :
                      type === 'Siren' ? 'bg-amber-500' :
                      type === 'Truck' ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}