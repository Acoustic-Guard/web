import { useMemo } from 'react';
import { 
   XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { Activity, ShieldAlert, Target } from 'lucide-react';

import { useIncidents } from '../../hooks/useIncidents';
import { useAlerts } from '../../hooks/useAlerts';

// Кольори для графіків (HEX-коди відповідно до твоїх Tailwind-класів)
const CHART_COLORS = {
  UAV: '#ef4444',       // red-500
  Explosion: '#dc2626', // red-600
  Siren: '#f59e0b',     // amber-500
  Generator: '#eab308'  // yellow-500
};

export default function Analytics() {
  const { incidents } = useIncidents();
  const { alerts } = useAlerts();

  // 1. Агрегація даних для кругової діаграми (Інциденти за типом)
  const typeStats = useMemo(() => {
    const stats = { UAV: 0, Explosion: 0, Siren: 0, Generator: 0 };
    incidents.forEach(inc => {
      if (inc.type in stats) {
        stats[inc.type as keyof typeof stats]++;
      }
    });
    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0); // Показуємо тільки ті, що існують
  }, [incidents]);

  // 2. Агрегація для лінійного графіка (Рівень довіри останніх 20 алертів)
  const timelineData = useMemo(() => {
    return [...alerts]
      .reverse() // Робимо хронологічний порядок (зліва направо)
      .slice(-20) // Беремо останні 20 для читабельності
      .map((alert) => ({
        time: alert.timestamp.substring(0, 5), // Формат "14:32"
        confidence: Math.round(alert.confidence * 100),
        type: alert.type
      }));
  }, [alerts]);

  return (
    <div className="p-6 h-full overflow-y-auto bg-[#0a0a0f]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics & History</h1>
        <p className="text-[#71717a] text-sm">Детальний аналіз акустичних загроз у реальному часі</p>
      </div>

      {/* ВЕРХНІ СТАТИСТИЧНІ КАРТКИ */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><Target size={24} /></div>
          <div>
            <div className="text-[#71717a] text-xs mb-1">Активних інцидентів</div>
            <div className="text-2xl font-bold text-white">{incidents.length}</div>
          </div>
        </div>
        <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-lg"><ShieldAlert size={24} /></div>
          <div>
            <div className="text-[#71717a] text-xs mb-1">Зафіксовано алертів</div>
            <div className="text-2xl font-bold text-white">{alerts.length}</div>
          </div>
        </div>
        <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg"><Activity size={24} /></div>
          <div>
            <div className="text-[#71717a] text-xs mb-1">Середня довіра (Confidence)</div>
            <div className="text-2xl font-bold text-white">
              {alerts.length > 0 
                ? Math.round((alerts.reduce((acc, a) => acc + a.confidence, 0) / alerts.length) * 100) 
                : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* ГРАФІКИ */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Графік 1: Кругова діаграма типів */}
        <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Розподіл загроз за типом</h3>
          <div className="h-64">
            {typeStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeStats}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {typeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[entry.name as keyof typeof CHART_COLORS] || '#71717a'} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0a0a0f', borderColor: '#1a1a24', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#71717a] text-sm">Немає активних інцидентів</div>
            )}
          </div>
        </div>

        {/* Графік 2: Динаміка алертів */}
        <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Динаміка впевненості (Confidence) останні 20 алертів</h3>
          <div className="h-64">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" vertical={false} />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0a0a0f', borderColor: '#1a1a24', borderRadius: '8px' }}
                    labelStyle={{ color: '#71717a', marginBottom: '4px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="confidence" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    dot={{ fill: '#0f0f17', stroke: '#2563eb', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#2563eb' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#71717a] text-sm">Немає даних для відображення</div>
            )}
          </div>
        </div>
      </div>

      {/* ТАБЛИЦЯ ІСТОРІЇ */}
      <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[#1a1a24]">
          <h3 className="text-white font-semibold text-sm">Останні зареєстровані алерти</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a1a24]/30 border-b border-[#1a1a24] text-[#71717a] text-xs">
                <th className="px-5 py-3 font-medium">Час</th>
                <th className="px-5 py-3 font-medium">Тип загрози</th>
                <th className="px-5 py-3 font-medium">Впевненість</th>
                <th className="px-5 py-3 font-medium">Локація / Вузол</th>
              </tr>
            </thead>
            <tbody>
              {alerts.slice(0, 10).map((alert) => (
                <tr key={alert.id} className="border-b border-[#1a1a24]/50 hover:bg-[#1a1a24]/30 transition-colors text-sm">
                  <td className="px-5 py-3 text-[#a1a1aa] whitespace-nowrap">{alert.timestamp}</td>
                  <td className="px-5 py-3">
                    <span className="text-white flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: CHART_COLORS[alert.type as keyof typeof CHART_COLORS] || '#71717a' }} />
                      {alert.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-emerald-400 font-medium">
                    {Math.round(alert.confidence * 100)}%
                  </td>
                  <td className="px-5 py-3 text-[#a1a1aa] font-mono text-xs">{alert.location}</td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-[#71717a] text-sm">
                    Історія порожня
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}