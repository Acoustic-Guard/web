/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Download, TrendingUp, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { getAnalytics, type AnalyticsData } from '../../services/analyticsService';

const THREAT_COLORS: Record<string, string> = {
  UAV: '#ef4444',
  Explosion: '#dc2626',
  Siren: '#f59e0b',
  Generator: '#eab308',
};

const THREAT_BADGES: Record<string, string> = {
  UAV: 'bg-red-500/10 text-red-400 border-red-500/20',
  Explosion: 'bg-red-600/10 text-red-500 border-red-600/20',
  Siren: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Generator: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

const STATUS_COLORS: Record<string, string> = {
  Resolved: 'text-emerald-400',
  Investigating: 'text-amber-400',
  Confirmed: 'text-red-400',
  Detected: 'text-blue-400',
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('24h');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const handleRangeChange = (range: string) => {
    if (range === timeRange) return; // не робимо нічого, якщо клікнули на ту ж саму кнопку
    setLoading(true);  // вмикаємо лоадер відразу при кліку
    setTimeRange(range); // змінюємо період
  };

  useEffect(() => {
    getAnalytics(timeRange)
      .then(setData)
      .catch((err) => console.error('Analytics load error:', err))
      .finally(() => setLoading(false));
  }, [timeRange]);

  const distributionData = useMemo(() => {
    if (!data) return [];
    return data.threatDistribution.map(item => ({
      ...item,
      color: THREAT_COLORS[item.name] || '#6b7280'
    })).sort((a, b) => b.value - a.value);
  }, [data]);

  const mostFrequent = distributionData[0] ?? null;

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0f] text-[#71717a]">
        <Loader2 className="animate-spin mr-2" /> Завантаження аналітики...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0f]">
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-[#1a1a24] flex items-center justify-between">
        <div className="flex items-center gap-4">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => handleRangeChange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${timeRange === range ? 'bg-[#2563eb] text-white' : 'bg-[#1a1a24] text-[#71717a] hover:text-white'
                }`}
            >
              Last {range === '24h' ? '24 hours' : range === '7d' ? '7 days' : '30 days'}
            </button>
          ))}
          <button className="px-3 py-1.5 rounded-lg text-sm bg-[#1a1a24] text-[#71717a] hover:text-white transition-colors flex items-center gap-2">
            <Calendar size={14} />
            Custom Range
          </button>
        </div>
        <button className="px-4 py-1.5 rounded-lg text-sm bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors flex items-center gap-2">
          <Download size={14} /> Export Report
        </button>
      </div>

      <div className="p-6">
        {/* ── KPI cards ── */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Incidents" value={data?.totalIncidents} icon={AlertTriangle} />
          <StatCard title="Most Frequent" value={mostFrequent?.name || '—'} subtitle={`${mostFrequent?.value || 0} detections`} icon={TrendingUp} valueColor={mostFrequent ? THREAT_COLORS[mostFrequent.name] : 'text-white'} />
          <StatCard title="Avg Confidence" value={data ? `${data.avgConfidence}%` : '—'} icon={Clock} />
          <StatCard title="Critical Events" value={data?.criticalCount} subtitle="Confidence > 85%" icon={AlertTriangle} valueColor="text-red-400" />
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="col-span-2 bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-4 flex flex-col items-center justify-center text-center">
            <TrendingUp size={32} className="text-[#2563eb] mb-3 opacity-50" />
            <h3 className="text-sm font-semibold text-white mb-1">Threat Frequency Over Time</h3>
            <p className="text-xs text-[#71717a] max-w-sm">
              Для відображення лінійного графіка (LineChart) бекенд має додати масив <code>timeSeries</code>.
              Зараз тут зарезервоване місце під майбутнє оновлення від Артема.
            </p>
          </div>

          <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Threat Distribution</h3>
            {loading ? (
              <div className="h-[280px] flex items-center justify-center text-[#71717a]"><Loader2 className="animate-spin" /></div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                      {distributionData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid #1a1a24', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {distributionData.map(item => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-white">{item.name}</span>
                      </div>
                      <span className="text-[#71717a]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1a1a24] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Historical Incidents</h3>
            <span className="text-xs text-[#71717a]">{data?.history?.length || 0} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0f]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717a]">Date/Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717a]">Threat Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717a]">Coordinates</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717a]">Confidence</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#71717a]">Status</th>
                </tr>
              </thead>
              <tbody className={loading ? 'opacity-50' : ''}>
                {data?.history?.map((incident, idx) => (
                  <tr key={idx} className="border-t border-[#1a1a24] hover:bg-[#1a1a24]/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-white">{incident.datetime}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${THREAT_BADGES[incident.type] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                        {incident.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#71717a]">{incident.coordinates}</td>
                    <td className="px-4 py-3 text-xs text-white">{incident.confidence >= 1 ? incident.confidence : `${Math.round(incident.confidence * 100)}%`}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${STATUS_COLORS[incident.status] || 'text-[#71717a]'}`}>
                        {incident.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, valueColor = "text-white" }: any) {
  return (
    <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3 text-[#71717a]">
        <Icon size={16} />
        <span className="text-xs">{title}</span>
      </div>
      <div className={`text-2xl font-semibold ${valueColor}`}>
        {value === undefined ? <Loader2 size={24} className="animate-spin text-[#71717a]" /> : value}
      </div>
      {subtitle && <div className="text-xs text-[#71717a] mt-1">{subtitle}</div>}
    </div>
  );
}