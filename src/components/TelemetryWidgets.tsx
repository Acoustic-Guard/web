import { Activity, Zap, Radio } from 'lucide-react';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'critical';
}

function MetricCard({ icon, label, value, unit, status = 'normal' }: MetricCardProps) {
  const statusColors = {
    normal: 'text-emerald-400',
    warning: 'text-amber-400',
    critical: 'text-red-400',
  };

  return (
    <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="text-[#71717a]">{icon}</div>
        <div className={`text-xs px-2 py-0.5 rounded ${
          status === 'normal' ? 'bg-emerald-500/10 text-emerald-400' :
          status === 'warning' ? 'bg-amber-500/10 text-amber-400' :
          'bg-red-500/10 text-red-400'
        }`}>
          {status.toUpperCase()}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-semibold ${statusColors[status]}`}>{value}</span>
        {unit && <span className="text-sm text-[#71717a]">{unit}</span>}
      </div>
      <div className="text-xs text-[#71717a] mt-1">{label}</div>
    </div>
  );
}

export function TelemetryWidgets() {
  return (
    <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-[#1a1a24]">
      <MetricCard
        icon={<Radio size={16} />}
        label="Active Sensor Nodes"
        value={247}
        unit="nodes"
        status="normal"
      />
      <MetricCard
        icon={<Zap size={16} />}
        label="Avg. System Latency"
        value={12}
        unit="ms"
        status="normal"
      />
      <MetricCard
        icon={<Activity size={16} />}
        label="Background Noise Level"
        value={42}
        unit="dB"
        status="normal"
      />
    </div>
  );
}
