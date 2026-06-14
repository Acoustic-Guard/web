/* eslint-disable @typescript-eslint/no-explicit-any */
import { Loader2 } from 'lucide-react';
import { formatDate } from '../../constants/analyticsUtils';

// ─── КАРТКА СТАТИСТИКИ ───
export function StatCard({ title, value, subtitle, icon: Icon, valueColor = "text-white" }: any) {
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

// ─── ПРИХОВАНИЙ ШАБЛОН ДРУКУ ───
export function PrintableReport({ data, timeRange, mostFrequent }: any) {
  return (
    <div className="hidden print:block bg-white text-slate-900 p-8 font-sans w-full">
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">Acoustic Guard</h1>
          <p className="text-xs text-slate-500 font-mono mt-1">Distributed urban acoustic monitoring system</p>
        </div>
        <div className="text-right text-xs font-mono text-slate-500">
          <div>DATE: {new Date().toLocaleDateString('uk-UA')}</div>
          <div>REPORT PERIOD: {timeRange.toUpperCase()}</div>
          <div>STATUS: OFFICIAL REPORT</div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-center mb-6 text-slate-800 uppercase tracking-tight">
        Acoustic Threat Detection Report
      </h2>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center">
          <div className="text-xs text-slate-500 mb-1">Total incidents</div>
          <div className="text-lg font-bold text-slate-900">{data?.totalIncidents || 0}</div>
        </div>
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center">
          <div className="text-xs text-slate-500 mb-1">Most frequent</div>
          <div className="text-lg font-bold text-slate-900">{mostFrequent?.name || '—'}</div>
        </div>
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center">
          <div className="text-xs text-slate-500 mb-1">Avg. confidence</div>
          <div className="text-lg font-bold text-slate-900">{data ? `${Math.round(data.avgConfidence)}%` : '—'}</div>
        </div>
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center">
          <div className="text-xs text-slate-500 mb-1">Critical events</div>
          <div className="text-lg font-bold text-red-600">{data?.criticalCount || 0}</div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-bold uppercase text-slate-700 mb-3 tracking-wider">Incident log</h3>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white uppercase font-mono">
              <th className="p-2 border border-slate-300">Date / Time</th>
              <th className="p-2 border border-slate-300">Threat type</th>
              <th className="p-2 border border-slate-300">Coordinates</th>
              <th className="p-2 border border-slate-300">Confidence</th>
              <th className="p-2 border border-slate-300">Status</th>
            </tr>
          </thead>
          <tbody className="font-mono divide-y divide-slate-200">
            {data?.history?.map((incident: any) => (
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
                <td colSpan={5} className="p-4 text-center text-slate-500">No records for the selected period</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-16 pt-4 border-t border-slate-200 flex justify-between text-xs text-slate-500 font-mono">
        <div>Report generated automatically</div>
      </div>
    </div>
  );
}