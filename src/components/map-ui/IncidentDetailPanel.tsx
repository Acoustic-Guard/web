/* eslint-disable @typescript-eslint/no-explicit-any */
import { X, CheckCircle } from 'lucide-react';
import { MARKER_COLORS } from '../../constants/ThreatColors';

interface Props {
  selectedIncident: any;
  setSelectedIncident: (incident: any) => void;
  handleResolve: () => void;
  isResolving: boolean;
}

export function IncidentDetailPanel({ selectedIncident, setSelectedIncident, handleResolve, isResolving }: Props) {
  if (!selectedIncident) return null;

  return (
    <div className="absolute top-4 right-16 z-[600] w-72 bg-[#0a0a0f]/95 backdrop-blur-md border border-[#1a1a24] rounded-xl p-4 shadow-2xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${MARKER_COLORS[selectedIncident.type as keyof typeof MARKER_COLORS] || 'bg-gray-500'}`} />
            <h3 className="text-white font-semibold text-sm uppercase">{selectedIncident.type}</h3>
          </div>
          <p className="text-[#71717a] text-[10px] font-mono tracking-wider">ID: {selectedIncident.id.split('-')[0]}</p>
        </div>
        <button onClick={() => setSelectedIncident(null)} className="text-[#71717a] hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-2 mb-5">
        {[
          { label: 'Рівень довіри:', value: `${Math.round(selectedIncident.intensity * 100)}%`, cls: 'text-emerald-400 font-semibold' },
          { label: 'Широта:',       value: (selectedIncident.lat ?? selectedIncident.latitude)?.toFixed(6),  cls: 'text-white font-mono' },
          { label: 'Довгота:',      value: (selectedIncident.lng ?? selectedIncident.longitude)?.toFixed(6), cls: 'text-white font-mono' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="flex justify-between items-center bg-[#1a1a24]/50 rounded px-2 py-1.5 text-xs">
            <span className="text-[#71717a]">{label}</span>
            <span className={cls}>{value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleResolve}
        disabled={isResolving}
        className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/50 disabled:opacity-50 text-emerald-400 text-xs font-semibold py-2 rounded-lg transition-colors flex justify-center items-center gap-2"
      >
        <CheckCircle size={14} />
        {isResolving ? 'Закриття...' : 'Позначити як Вирішено'}
      </button>
    </div>
  );
}