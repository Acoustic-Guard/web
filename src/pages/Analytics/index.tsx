/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from 'react';
import { Calendar, TrendingUp, AlertTriangle, Clock, Loader2, Printer } from 'lucide-react';
import { getAnalytics, type AnalyticsData } from '../../services/analyticsService';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  ChartLegend,
  ArcElement
);

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
  const [appliedStart, setAppliedStart] = useState('');
  const [appliedEnd, setAppliedEnd] = useState('');

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [inputStart, setInputStart] = useState('');
  const [inputEnd, setInputEnd] = useState('');

  useEffect(() => {
    const fetchAnalyticsData = (isInitial = false) => {
      if (isInitial) setLoading(true);

      getAnalytics(timeRange, appliedStart, appliedEnd)
        .then(setData)
        .catch((err) => console.error('Analytics load error:', err))
        .finally(() => {
          if (isInitial) setLoading(false);
        });
    };

    fetchAnalyticsData(true);

    const intervalId = setInterval(() => {
      fetchAnalyticsData(false);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [timeRange, appliedStart, appliedEnd]);

  const handleStandardRangeChange = (range: string) => {
    setShowDatePicker(false);
    if (range === timeRange) return;
    setTimeRange(range);
  };

  const handleCustomRangeApply = () => {
    if (!inputStart || !inputEnd) return;
    setAppliedStart(inputStart);
    setAppliedEnd(inputEnd);
    setTimeRange('custom');
  };

  const distributionData = useMemo(() => {
    if (!data?.threatDistribution) return [];
    return data.threatDistribution.map(item => ({
      ...item,
      color: THREAT_COLORS[item.name] || '#6b7280'
    })).sort((a, b) => b.value - a.value);
  }, [data]);

  const mostFrequent = distributionData[0] ?? null;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('uk-UA', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  // 🟢 Нова логіка експорту — просто викликаємо нативний друк браузера
  const handleExportReport = () => {
    if (!data?.history || data.history.length === 0) {
      alert("Немає даних для експорту");
      return;
    }
    window.print();
  };

  const actualTimeSeries = data?.timeSeries || [];

  const lineChartData = {
    labels: actualTimeSeries.map((p: any) => {
      const timeStamp = p.timestamp || p.createdAt || new Date().toISOString();
      return new Date(timeStamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    }),
    datasets: [
      { label: 'UAV', data: actualTimeSeries.map((p: any) => p.UAV || 0), borderColor: THREAT_COLORS.UAV, tension: 0.4, pointRadius: 0, borderWidth: 2 },
      { label: 'Explosion', data: actualTimeSeries.map((p: any) => p.Explosion || 0), borderColor: THREAT_COLORS.Explosion, tension: 0.4, pointRadius: 0, borderWidth: 2 },
      { label: 'Siren', data: actualTimeSeries.map((p: any) => p.Siren || 0), borderColor: THREAT_COLORS.Siren, tension: 0.4, pointRadius: 0, borderWidth: 2 },
      { label: 'Generator', data: actualTimeSeries.map((p: any) => p.Generator || 0), borderColor: THREAT_COLORS.Generator, tension: 0.4, pointRadius: 0, borderWidth: 2 },
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    animation: { duration: 0 },
    plugins: {
      legend: { labels: { color: '#e4e4e7', font: { size: 12 }, boxWidth: 12 } },
      tooltip: { backgroundColor: '#0a0a0f', borderColor: '#1a1a24', borderWidth: 1, padding: 10 }
    },
    scales: {
      x: { ticks: { color: '#71717a', font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: '#71717a', font: { size: 11 }, stepSize: 1 }, grid: { color: '#1a1a24' }, min: 0 }
    }
  };

  const pieChartData = {
    labels: distributionData.map(d => d.name),
    datasets: [{
      data: distributionData.map(d => d.value),
      backgroundColor: distributionData.map(d => d.color),
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#0a0a0f', borderColor: '#1a1a24', borderWidth: 1 }
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0f] text-[#71717a]">
        <Loader2 className="animate-spin mr-2" /> Завантаження аналітики...
      </div>
    );
  }

  return (
    <>
      {/* ─── ЕКРАННИЙ ІНТЕРФЕЙС (Ховається під час друку завдяки print:hidden) ─── */}
      <div className="flex-1 overflow-y-auto bg-[#0a0a0f] print:hidden">
        <div className="px-6 py-4 border-b border-[#1a1a24] flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => handleStandardRangeChange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  timeRange === range && !showDatePicker ? 'bg-[#2563eb] text-white' : 'bg-[#1a1a24] text-[#71717a] hover:text-white'
                }`}
              >
                Last {range === '24h' ? '24 hours' : range === '7d' ? '7 days' : '30 days'}
              </button>
            ))}
            
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                showDatePicker || timeRange === 'custom' ? 'bg-[#2563eb] text-white' : 'bg-[#1a1a24] text-[#71717a] hover:text-white'
              }`}
            >
              <Calendar size={14} /> Custom Range
            </button>

            {showDatePicker && (
              <div className="flex items-center gap-2 bg-[#1a1a24] p-1 rounded-lg ml-2 border border-[#333]">
                <input 
                  type="date" 
                  value={inputStart}
                  onChange={(e) => setInputStart(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="bg-transparent text-sm text-white px-2 outline-none cursor-pointer"
                />
                <span className="text-[#71717a]">-</span>
                <input 
                  type="date" 
                  value={inputEnd}
                  onChange={(e) => setInputEnd(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="bg-transparent text-sm text-white px-2 outline-none cursor-pointer"
                />
                <button 
                  onClick={handleCustomRangeApply}
                  disabled={!inputStart || !inputEnd}
                  className="px-3 py-1 bg-[#2563eb] text-white rounded text-sm disabled:opacity-50 hover:bg-[#1d4ed8] transition-colors"
                >
                  Go
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleExportReport}
            disabled={loading || !data?.history}
            className="px-4 py-1.5 rounded-lg text-sm bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer size={14} /> Export PDF Report
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Incidents" value={data?.totalIncidents} icon={AlertTriangle} />
            <StatCard title="Most Frequent" value={mostFrequent?.name || '—'} subtitle={`${mostFrequent?.value || 0} detections`} icon={TrendingUp} valueColor={mostFrequent ? THREAT_COLORS[mostFrequent.name] : 'text-white'} />
            <StatCard
              title="Avg Confidence"
              value={data ? `${Math.round(data.avgConfidence)}%` : '—'}
              icon={Clock}
            />
            <StatCard title="Critical Events" value={data?.criticalCount} subtitle="Confidence > 90%" icon={AlertTriangle} valueColor="text-red-400" />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="col-span-2 bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-4" style={{ minWidth: 0 }}>
              <h3 className="text-sm font-semibold text-white mb-4">Threat Frequency Over Time</h3>
              <div className="relative w-full h-[220px]">
                {actualTimeSeries.length > 0 ? (
                  <Line data={lineChartData} options={lineChartOptions} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#71717a] text-sm">
                    Немає даних для графіка
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Threat Distribution</h3>
              {loading ? (
                <div className="h-[280px] flex items-center justify-center text-[#71717a]"><Loader2 className="animate-spin" /></div>
              ) : (
                <>
                  {distributionData.length > 0 ? (
                    <>
                      <div className="relative w-full h-[180px]">
                        <Doughnut data={pieChartData} options={pieChartOptions} />
                      </div>
                      <div className="mt-6 space-y-2">
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
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-[#71717a] text-sm">
                      Немає даних для графіка
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

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
                  {data?.history?.length ? (
                    data.history.map((incident) => (
                      <tr key={incident.id} className="border-t border-[#1a1a24] hover:bg-[#1a1a24]/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-white">{formatDate(incident.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold border ${THREAT_BADGES[incident.type] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                            {incident.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#71717a]">
                          {incident.latitude != null && incident.longitude != null
                            ? `${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-white">
                          {Math.round(incident.intensity * 100)}%
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${STATUS_COLORS[incident.status] || 'text-[#71717a]'}`}>
                            {incident.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-[#71717a]">
                        Немає записаних інцидентів
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ПРИХОВАНИЙ ПРОФЕСІЙНИЙ ШАБЛОН ЗВІТУ (З'являється ТІЛЬКИ в PDF) ─── */}
      <div className="hidden print:block bg-white text-slate-900 p-8 font-sans w-full">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">Acoustic Guard</h1>
            <p className="text-xs text-slate-500 font-mono mt-1">Система розподіленого міського акустичного моніторингу</p>
          </div>
          <div className="text-right text-xs font-mono text-slate-500">
            <div>ДАТА: {new Date().toLocaleDateString('uk-UA')}</div>
            <div>ПЕРІОД ЗВІТУ: {timeRange.toUpperCase()}</div>
            <div>СТАТУС: ЗВІТ</div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-center mb-6 text-slate-800 uppercase tracking-tight">
          Аналітичний звіт фіксації акустичних загроз
        </h2>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center">
            <div className="text-xs text-slate-500 mb-1">Усього інцидентів</div>
            <div className="text-lg font-bold text-slate-900">{data?.totalIncidents || 0}</div>
          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center">
            <div className="text-xs text-slate-500 mb-1">Часта загроза</div>
            <div className="text-lg font-bold text-slate-900">{mostFrequent?.name || '—'}</div>
          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center">
            <div className="text-xs text-slate-500 mb-1">Сер. рівень довіри</div>
            <div className="text-lg font-bold text-slate-900">{data ? `${Math.round(data.avgConfidence)}%` : '—'}</div>
          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center">
            <div className="text-xs text-slate-500 mb-1">Критичні події</div>
            <div className="text-lg font-bold text-red-600">{data?.criticalCount || 0}</div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase text-slate-700 mb-3 tracking-wider">Журнал інцидентів</h3>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase font-mono">
                <th className="p-2 border border-slate-300">Дата / Час</th>
                <th className="p-2 border border-slate-300">Тип загрози</th>
                <th className="p-2 border border-slate-300">Координати</th>
                <th className="p-2 border border-slate-300">Довіра</th>
                <th className="p-2 border border-slate-300">Статус</th>
              </tr>
            </thead>
            <tbody className="font-mono divide-y divide-slate-200">
              {data?.history?.map((incident) => (
                <tr key={incident.id}>
                  <td className="p-2 border border-slate-300">{formatDate(incident.createdAt)}</td>
                  <td className={`p-2 border border-slate-300 font-sans font-bold ${incident.type === 'Explosion' || incident.type === 'UAV' ? 'text-red-600' : 'text-slate-800'}`}>
                    {incident.type}
                  </td>
                  <td className="p-2 border border-slate-300 text-slate-600">
                    {incident.latitude != null && incident.longitude != null ? `${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}` : '—'}
                  </td>
                  <td className="p-2 border border-slate-300">{Math.round(incident.intensity * 100)}%</td>
                  <td className="p-2 border border-slate-300">{incident.status}</td>
                </tr>
              ))}
              {(!data?.history || data.history.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">Немає записів за обраний період</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-16 pt-4 border-t border-slate-200 flex justify-between text-xs text-slate-500 font-mono">
          <div>Звіт згенеровано автоматично</div>
        </div>
      </div>
    </>
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