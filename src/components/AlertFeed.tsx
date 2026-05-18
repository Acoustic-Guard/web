
interface Alert {
  id: string;
  type: 'UAV' | 'Siren' | 'Explosion' | 'Generator';
  timestamp: string;
  confidence: number;
  location: string;
}

interface AlertCardProps {
  alert: Alert;
}

function AlertCard({ alert }: AlertCardProps) {
  const threatColors: Record<Alert['type'], string> = {
    UAV: 'bg-red-500/10 text-red-400 border-red-500/20',
    Explosion: 'bg-red-500/10 text-red-400 border-red-500/20',
    Siren: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Generator: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };

  const confidenceColor =
    alert.confidence >= 0.8 ? 'text-red-400' :
    alert.confidence >= 0.6 ? 'text-amber-400' :
    'text-yellow-400';

  return (
    <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-3 hover:border-[#2a2a34] transition-colors">
      <div className="flex items-start justify-between mb-2">
        <span className={`px-2 py-1 rounded text-xs font-semibold border ${threatColors[alert.type]}`}>
          {alert.type}
        </span>
        <span className={`text-xs font-semibold ${confidenceColor}`}>
          {Math.round(alert.confidence * 100)}%
        </span>
      </div>
      <div className="text-xs text-[#71717a] mb-1">{alert.location}</div>
      <div className="text-xs text-[#52525b]">{alert.timestamp}</div>
    </div>
  );
}

export function AlertFeed() {
  const alerts: Alert[] = [
    {
      id: '1',
      type: 'UAV',
      timestamp: '2026-05-18 14:23:45',
      confidence: 0.92,
      location: 'Sector 7-B, Grid 45.2',
    },
    {
      id: '2',
      type: 'Explosion',
      timestamp: '2026-05-18 14:21:12',
      confidence: 0.88,
      location: 'Sector 3-A, Grid 22.8',
    },
    {
      id: '3',
      type: 'Siren',
      timestamp: '2026-05-18 14:18:33',
      confidence: 0.76,
      location: 'Sector 5-C, Grid 34.1',
    },
    {
      id: '4',
      type: 'Generator',
      timestamp: '2026-05-18 14:15:08',
      confidence: 0.64,
      location: 'Sector 2-D, Grid 18.5',
    },
    {
      id: '5',
      type: 'UAV',
      timestamp: '2026-05-18 14:12:56',
      confidence: 0.81,
      location: 'Sector 8-A, Grid 51.3',
    },
    {
      id: '6',
      type: 'Siren',
      timestamp: '2026-05-18 14:09:22',
      confidence: 0.71,
      location: 'Sector 4-B, Grid 28.7',
    },
  ];

  return (
    <div className="w-80 bg-[#0a0a0f] border-l border-[#1a1a24] flex flex-col">
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
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}
