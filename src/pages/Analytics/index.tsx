import { useState, useMemo } from 'react';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Calendar, Download, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

import { useAlerts }    from '../../hooks/useAlerts';
import { useIncidents } from '../../hooks/useIncidents';
import { useTelemetry } from '../../hooks/useTelemetry';
import type { Alert, IncidentMarker } from '../../types/incidents';

// ─── Constants ────────────────────────────────────────────────────────────────

const THREAT_COLORS: Record<string, string> = {
  UAV:       '#ef4444',
  Explosion: '#dc2626',
  Siren:     '#f59e0b',
  Generator: '#eab308',
};

const THREAT_BADGE: Record<string, string> = {
  UAV:       'bg-red-500/10 text-red-400 border-red-500/20',
  Explosion: 'bg-red-600/10 text-red-500 border-red-600/20',
  Siren:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Generator: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

const STATUS_COLORS: Record<string, string> = {
  Resolved:     'text-emerald-400',
  Investigating:'text-amber-400',
  Confirmed:    'text-red-400',
  Detected:     'text-blue-400',
};

type TimeRange = '24h' | '7d' | '30d';

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: '24h', label: 'Last 24 hours' },
  { key: '7d',  label: 'Last 7 days'   },
  { key: '30d', label: 'Last 30 days'  },
];

// const RANGE_MS: Record<TimeRange, number> = {
//   '24h': 86_400_000,
//   '7d':  604_800_000,
//   '30d': 2_592_000_000,
// };

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Filter alerts by time range using the timestamp string (HH:MM:SS from mapApiAlert) */
function filterAlertsByRange(alerts: Alert[], _range: TimeRange): Alert[] {
  // Alert.timestamp is already formatted as a locale string by mapApiAlert,
  // so we can't filter by real time — return all (the hook already caps at 100)
  return alerts;
}

/** Build time-series buckets for the line chart from raw alerts */
function buildTimeSeries(alerts: Alert[], range: TimeRange) {
  const slots  = range === '24h' ? 8 : range === '7d' ? 7 : 6;
  const slotMs = { '24h': 3 * 3_600_000, '7d': 86_400_000, '30d': 5 * 86_400_000 }[range];
  const now    = Date.now();

  type Row = { time: string; UAV: number; Explosion: number; Siren: number; Generator: number };

  const buckets: Row[] = Array.from({ length: slots }, (_, i) => {
    const t = new Date(now - (slots - 1 - i) * slotMs);
    const label = range === '24h'
      ? t.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
      : t.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' });
    return { time: label, UAV: 0, Explosion: 0, Siren: 0, Generator: 0 };
  });

  // Alert.timestamp is HH:MM:SS — only usable for 24h bucketing
  if (range === '24h') {
    for (const alert of alerts) {
      const [hStr] = alert.timestamp.split(':');
      const hour   = parseInt(hStr, 10);
      if (isNaN(hour)) continue;
      const idx = Math.floor(hour / 3); // 0-7
      if (idx >= 0 && idx < slots && alert.type in THREAT_COLORS) {
        buckets[idx][alert.type as keyof Omit<Row, 'time'>] += 1;
      }
    }
  }

  return buckets;
}

function buildDistribution(alerts: Alert[]) {
  const counts: Partial<Record<string, number>> = {};
  for (const a of alerts) {
    counts[a.type] = (counts[a.type] ?? 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([name, value]) => ({ name, value: value!, color: THREAT_COLORS[name] ?? '#6b7280' }))
    .sort((a, b) => b.value - a.value);
}

function handleExportCSV(incidents: IncidentMarker[]) {
  const rows = [
    'ID,Type,Latitude,Longitude,Intensity,Status',
    ...incidents.map(i =>
      `"${i.id}","${i.type}","${i.lat}","${i.lng}","${Math.round(i.intensity * 100)}%","${i.status ?? ''}"`
    ),
  ].join('\n');
  const blob = new Blob([rows], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'acoustic-guard-incidents.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  const { alerts,    loading: aLoading } = useAlerts();
  const { incidents, loading: iLoading } = useIncidents();
  const { metrics,   loading: tLoading } = useTelemetry();

  const loading = aLoading || iLoading || tLoading;

  // Derived
  const filteredAlerts    = useMemo(() => filterAlertsByRange(alerts, timeRange), [alerts, timeRange]);
  const timeSeriesData    = useMemo(() => buildTimeSeries(filteredAlerts, timeRange), [filteredAlerts, timeRange]);
  const distributionData  = useMemo(() => buildDistribution(filteredAlerts), [filteredAlerts]);
  const criticalCount     = useMemo(() => filteredAlerts.filter(a => a.confidence >= 0.85).length, [filteredAlerts]);
  const mostFrequent      = distributionData[0] ?? null;

  // Telemetry: find activeNodes metric
  const activeNodesMetric = metrics.find(m => m.label === 'Active Sensor Nodes');

  // Incidents sorted newest-first (by array order — newest pushed last in hook)
  const tableIncidents = useMemo(
    () => [...incidents].reverse().slice(0, 50),
    [incidents]
  );

  return (
    <div className="flex-1 overflow-y-auto">

      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-[#1a1a24] flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {TIME_RANGES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeRange(key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                timeRange === key
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-[#1a1a24] text-[#71717a] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
          <button className="px-3 py-1.5 rounded-lg text-sm bg-[#1a1a24] text-[#71717a] hover:text-white transition-colors flex items-center gap-2">
            <Calendar size={14} />
            Custom Range
          </button>
        </div>

        <button
          onClick={() => handleExportCSV(incidents)}
          className="px-4 py-1.5 rounded-lg text-sm bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors flex items-center gap-2"
        >
          <Download size={14} />
          Export Report
        </button>
      </div>

      <div className="p-6">

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-[#71717a]" />
              <span className="text-xs text-[#71717a]">Total Incidents</span>
            </div>
            {loading
              ? <div className="h-8 w-16 bg-[#1a1a24] rounded animate-pulse" />
              : <div className="text-2xl font-semibold text-white">{incidents.length}</div>
            }
            <div className="text-xs text-[#71717a] mt-1">active</div>
          </div>

          <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-[#71717a]" />
              <span className="text-xs text-[#71717a]">Most Frequent</span>
            </div>
            {loading
              ? <div className="h-8 w-24 bg-[#1a1a24] rounded animate-pulse" />
              : mostFrequent
                ? <>
                    <div className="text-2xl font-semibold" style={{ color: THREAT_COLORS[mostFrequent.name] }}>
                      {mostFrequent.name}
                    </div>
                    <div className="text-xs text-[#71717a] mt-1">{mostFrequent.value} detections</div>
                  </>
                : <div className="text-2xl font-semibold text-[#71717a]">—</div>
            }
          </div>

          <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-[#71717a]" />
              <span className="text-xs text-[#71717a]">Active Nodes</span>
            </div>
            {loading
              ? <div className="h-8 w-16 bg-[#1a1a24] rounded animate-pulse" />
              : activeNodesMetric
                ? <>
                    <div className="text-2xl font-semibold text-white">
                      {activeNodesMetric.value}
                      <span className="text-sm text-[#71717a] ml-1">nodes</span>
                    </div>
                    <div className={`text-xs mt-1 ${
                      activeNodesMetric.status === 'normal'   ? 'text-emerald-400' :
                      activeNodesMetric.status === 'warning'  ? 'text-amber-400'   : 'text-red-400'
                    }`}>
                      {activeNodesMetric.status}
                    </div>
                  </>
                : <div className="text-2xl font-semibold text-[#71717a]">—</div>
            }
          </div>

          <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-[#71717a]" />
              <span className="text-xs text-[#71717a]">Critical Alerts</span>
            </div>
            {loading
              ? <div className="h-8 w-12 bg-[#1a1a24] rounded animate-pulse" />
              : <>
                  <div className="text-2xl font-semibold text-red-400">{criticalCount}</div>
                  <div className="text-xs text-[#71717a] mt-1">confidence &gt;85%</div>
                </>
            }
          </div>

        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

          <div className="lg:col-span-2 bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Threat Frequency Over Time</h3>
            {loading
              ? <div className="h-[280px] bg-[#1a1a24] rounded animate-pulse" />
              : <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" />
                    <XAxis dataKey="time" stroke="#71717a" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#71717a" style={{ fontSize: '11px' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid #1a1a24', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    {Object.entries(THREAT_COLORS).map(([key, color]) => (
                      <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
            }
          </div>

          <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Threat Distribution</h3>
            {loading
              ? <div className="h-[280px] bg-[#1a1a24] rounded animate-pulse" />
              : distributionData.length === 0
                ? <div className="h-[280px] flex items-center justify-center text-[#71717a] text-sm">No data</div>
                : <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={distributionData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
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
            }
          </div>

        </div>

        {/* ── Table ── */}
        <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1a1a24] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Historical Incidents</h3>
            <span className="text-xs text-[#71717a]">{tableIncidents.length} records</span>
          </div>

          {loading
            ? <div className="p-6 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 bg-[#1a1a24] rounded animate-pulse" />
                ))}
              </div>
            : tableIncidents.length === 0
              ? <div className="p-6 text-center text-[#71717a] text-sm">No incidents</div>
              : <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#0a0a0f]">
                      <tr>
                        {['Threat Type', 'Coordinates', 'Intensity', 'Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#71717a]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableIncidents.map(incident => (
                        <tr key={incident.id} className="border-t border-[#1a1a24] hover:bg-[#1a1a24]/30 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold border ${THREAT_BADGE[incident.type] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                              {incident.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#71717a] whitespace-nowrap">
                            {incident.lat.toFixed(4)}°N, {incident.lng.toFixed(4)}°E
                          </td>
                          <td className="px-4 py-3 text-xs text-white">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-[#1a1a24] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.round(incident.intensity * 100)}%`,
                                    backgroundColor:
                                      incident.intensity >= 0.9 ? '#ef4444' :
                                      incident.intensity >= 0.8 ? '#f59e0b' : '#3b82f6',
                                  }}
                                />
                              </div>
                              <span>{Math.round(incident.intensity * 100)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold ${STATUS_COLORS[incident.status ?? ''] ?? 'text-[#71717a]'}`}>
                              {incident.status ?? '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
          }
        </div>

      </div>
    </div>
  );
}