import { useAlerts } from '../hooks/useAlerts';
import { THREAT_BADGE_COLORS, getConfidenceColor } from '../constants/ThreatColors';
import type { AlertCardProps } from '../types/incidents';

function AlertCard({ alert }: AlertCardProps) {
  return (
    <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-3 hover:border-[#2a2a34] transition-colors">
      <div className="flex items-start justify-between mb-2">
        <span className={`px-2 py-1 rounded text-xs font-semibold border ${THREAT_BADGE_COLORS[alert.type]}`}>
          {alert.type}
        </span>
        <span className={`text-xs font-semibold ${getConfidenceColor(alert.confidence)}`}>
          {Math.round(alert.confidence * 100)}%
        </span>
      </div>
      <div className="text-xs text-[#71717a] mb-1">{alert.location}</div>
      <div className="text-xs text-[#52525b]">{alert.timestamp}</div>
    </div>
  );
}

export function AlertFeed() {
  const { alerts, loading, error } = useAlerts();

  return (
    <div className="w-80 bg-[#0a0a0f] border-l border-[#1a1a24] flex flex-col h-full">
      <div className="px-4 py-4 border-b border-[#1a1a24]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-white">Alert Feed</h2>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-[#71717a]">Live</span>
          </div>
        </div>
        <p className="text-xs text-[#71717a]">Real-time acoustic threats</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <p className="text-xs text-[#71717a] text-center pt-4">Завантаження...</p>
        )}
        {error && (
          <p className="text-xs text-red-400 text-center pt-4">Помилка: {error}</p>
        )}
        {!loading && !error && alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}