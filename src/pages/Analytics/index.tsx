/* eslint-disable @typescript-eslint/no-explicit-any */
import { Calendar, TrendingUp, AlertTriangle, Clock, Loader2, Printer } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend as ChartLegend, ArcElement } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

import { useAnalytics } from '../../hooks/useAnalytics';
import { StatCard, PrintableReport } from '../../components/analytics-ui/AnalyticsComponents';
import { THREAT_COLORS, THREAT_BADGES, STATUS_COLORS, formatDate } from '../../constants/analyticsUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, ChartLegend, ArcElement);

export default function AnalyticsPage() {
  const {
    data, loading, timeRange, showDatePicker, setShowDatePicker,
    inputStart, setInputStart, inputEnd, setInputEnd,
    handleStandardRangeChange, handleCustomRangeApply,
    distributionData, mostFrequent
  } = useAnalytics();

  const handleExportReport = () => {
    if (!data?.history || data.history.length === 0) {
      alert("Немає даних для експорту");
      return;
    }
    window.print();
  };

  const actualTimeSeries = data?.timeSeries || [];

  const lineChartData = {
    labels: actualTimeSeries.map((p: any) => new Date(p.timestamp || p.createdAt || new Date().toISOString()).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      { label: 'UAV', data: actualTimeSeries.map((p: any) => p.UAV || 0), borderColor: THREAT_COLORS.UAV, tension: 0.4, pointRadius: 0, borderWidth: 2 },
      { label: 'Explosion', data: actualTimeSeries.map((p: any) => p.Explosion || 0), borderColor: THREAT_COLORS.Explosion, tension: 0.4, pointRadius: 0, borderWidth: 2 },
      { label: 'Siren', data: actualTimeSeries.map((p: any) => p.Siren || 0), borderColor: THREAT_COLORS.Siren, tension: 0.4, pointRadius: 0, borderWidth: 2 },
      { label: 'Generator', data: actualTimeSeries.map((p: any) => p.Generator || 0), borderColor: THREAT_COLORS.Generator, tension: 0.4, pointRadius: 0, borderWidth: 2 },
    ]
  };

  const lineChartOptions = {
    responsive: true, maintainAspectRatio: false, interaction: { mode: 'index' as const, intersect: false }, animation: { duration: 0 },
    plugins: { legend: { labels: { color: '#e4e4e7', font: { size: 12 }, boxWidth: 12 } }, tooltip: { backgroundColor: '#0a0a0f', borderColor: '#1a1a24', borderWidth: 1, padding: 10 } },
    scales: { x: { ticks: { color: '#71717a', font: { size: 10 } }, grid: { display: false } }, y: { ticks: { color: '#71717a', font: { size: 11 }, stepSize: 1 }, grid: { color: '#1a1a24' }, min: 0 } }
  };

  const pieChartData = {
    labels: distributionData.map(d => d.name),
    datasets: [{ data: distributionData.map(d => d.value), backgroundColor: distributionData.map(d => d.color), borderWidth: 0, hoverOffset: 4 }]
  };

  const pieChartOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '75%',
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0a0a0f', borderColor: '#1a1a24', borderWidth: 1 } }
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
      <div className="flex-1 overflow-y-auto bg-[#0a0a0f] print:hidden">
        {/* Шапка з фільтрами */}
        <div className="px-6 py-4 border-b border-[#1a1a24] flex items-center justify-between">
          <div className="flex items-center gap-4">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => handleStandardRangeChange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${timeRange === range && !showDatePicker ? 'bg-[#2563eb] text-white' : 'bg-[#1a1a24] text-[#71717a] hover:text-white'}`}
              >
                Last {range === '24h' ? '24 hours' : range === '7d' ? '7 days' : '30 days'}
              </button>
            ))}
            
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${showDatePicker || timeRange === 'custom' ? 'bg-[#2563eb] text-white' : 'bg-[#1a1a24] text-[#71717a] hover:text-white'}`}
            >
              <Calendar size={14} /> Custom Range
            </button>

            {showDatePicker && (
              <div className="flex items-center gap-2 bg-[#1a1a24] p-1 rounded-lg ml-2 border border-[#333]">
                <input type="date" value={inputStart} onChange={(e) => setInputStart(e.target.value)} style={{ colorScheme: 'dark' }} className="bg-transparent text-sm text-white px-2 outline-none cursor-pointer" />
                <span className="text-[#71717a]">-</span>
                <input type="date" value={inputEnd} onChange={(e) => setInputEnd(e.target.value)} style={{ colorScheme: 'dark' }} className="bg-transparent text-sm text-white px-2 outline-none cursor-pointer" />
                <button onClick={handleCustomRangeApply} disabled={!inputStart || !inputEnd} className="px-3 py-1 bg-[#2563eb] text-white rounded text-sm disabled:opacity-50 hover:bg-[#1d4ed8] transition-colors">Go</button>
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

        {/* Дашборд */}
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Incidents" value={data?.totalIncidents} icon={AlertTriangle} />
            <StatCard title="Most Frequent" value={mostFrequent?.name || '—'} subtitle={`${mostFrequent?.value || 0} detections`} icon={TrendingUp} valueColor={mostFrequent ? THREAT_COLORS[mostFrequent.name] : 'text-white'} />
            <StatCard title="Avg Confidence" value={data ? `${Math.round(data.avgConfidence)}%` : '—'} icon={Clock} />
            <StatCard title="Critical Events" value={data?.criticalCount} subtitle="Confidence > 90%" icon={AlertTriangle} valueColor="text-red-400" />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="col-span-2 bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-4" style={{ minWidth: 0 }}>
              <h3 className="text-sm font-semibold text-white mb-4">Threat Frequency Over Time</h3>
              <div className="relative w-full h-[220px]">
                {actualTimeSeries.length > 0 ? <Line data={lineChartData} options={lineChartOptions} /> : <div className="w-full h-full flex items-center justify-center text-[#71717a] text-sm">Немає даних</div>}
              </div>
            </div>

            <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Threat Distribution</h3>
              {loading ? (
                <div className="h-[280px] flex items-center justify-center text-[#71717a]"><Loader2 className="animate-spin" /></div>
              ) : distributionData.length > 0 ? (
                <>
                  <div className="relative w-full h-[180px]"><Doughnut data={pieChartData} options={pieChartOptions} /></div>
                  <div className="mt-6 space-y-2">
                    {distributionData.map(item => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-white">{item.name}</span></div>
                        <span className="text-[#71717a]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="h-[280px] flex items-center justify-center text-[#71717a] text-sm">Немає даних</div>}
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
                    {['Date/Time', 'Threat Type', 'Coordinates', 'Confidence', 'Status'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#71717a]">{h}</th>)}
                  </tr>
                </thead>
                <tbody className={loading ? 'opacity-50' : ''}>
                  {data?.history?.length ? data.history.map((incident) => (
                    <tr key={incident.id} className="border-t border-[#1a1a24] hover:bg-[#1a1a24]/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-white">{formatDate(incident.createdAt)}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-semibold border ${THREAT_BADGES[incident.type] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>{incident.type}</span></td>
                      <td className="px-4 py-3 text-xs text-[#71717a]">{incident.latitude != null && incident.longitude != null ? `${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}` : '—'}</td>
                      <td className="px-4 py-3 text-xs text-white">{Math.round(incident.intensity * 100)}%</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold ${STATUS_COLORS[incident.status] || 'text-[#71717a]'}`}>{incident.status}</span></td>
                    </tr>
                  )) : <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-[#71717a]">Немає записаних інцидентів</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <PrintableReport data={data} timeRange={timeRange} mostFrequent={mostFrequent} />
    </>
  );
}