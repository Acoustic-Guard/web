/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { ensureConnected, getStompClient } from '../../services/stompClient';
import { fetchWithAuth, WS_TOPICS } from '../../config/api';
import { Wifi, XCircle, Cpu, Database } from 'lucide-react';

/**
 * Модель вузла сенсорної мережі.
 * Відображає апаратний стан та якість зв'язку акустичного датчика.
 */
interface SensorNode {
  id: string;
  location: string;
  status: 'online' | 'offline' | 'warning';
  latency: number;
  uptime: string;
  lastHeartbeat: string;
}

/**
 * Резервні тестові дані (fallback).
 * Забезпечують працездатність інтерфейсу та демонстрацію функціоналу 
 * у разі тимчасової недоступності бекенду або відсутності реальних даних.
 */
const MOCK_SENSORS: SensorNode[] = [
  { id: 'AG-NODE-001', location: 'Shevchenkivskyi', status: 'online', latency: 12, uptime: '99.9%', lastHeartbeat: new Date().toISOString() },
  { id: 'AG-NODE-002', location: 'Obolon', status: 'warning', latency: 145, uptime: '98.5%', lastHeartbeat: new Date(Date.now() - 50000).toISOString() },
  { id: 'AG-NODE-003', location: 'Podil', status: 'offline', latency: 0, uptime: '45.2%', lastHeartbeat: new Date(Date.now() - 3600000).toISOString() },
  { id: 'AG-NODE-004', location: 'Pechersk', status: 'online', latency: 8, uptime: '99.9%', lastHeartbeat: new Date().toISOString() },
];

/**
 * Сторінка моніторингу стану апаратної мережі (Network Dashboard).
 * Відповідає за:
 * 1. Завантаження початкового стану вузлів через REST API.
 * 2. Підтримку актуальності даних у реальному часі через WebSocket (STOMP).
 * 3. Відображення загальних KPI та детальної таблиці сенсорів.
 */
export default function NetworkPage() {
  const [sensors, setSensors] = useState<SensorNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [brokerStatus, setBrokerStatus] = useState<'Healthy' | 'Offline' | 'Connecting...'>('Connecting...');

  useEffect(() => {
    fetchWithAuth('/sensors')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log('Дані від беку:', data);
       const sensorArray = Array.isArray(data) ? data : (data?.content || data?.sensors || []);
        
        if (sensorArray.length === 0) {
          console.warn('Бекенд повернув порожній масив. Використовуємо тестові дані.');
          setSensors(MOCK_SENSORS);
        } else {
          setSensors(sensorArray);
        }
      })
      .catch((err) => {
        console.error('Network load error:', err);
        console.log('Підставляємо тестові дані через помилку з\'єднання з API.');
        setSensors(MOCK_SENSORS);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let sub: any;

    ensureConnected()
      .then(() => {
        setBrokerStatus('Healthy');
        
        const client = getStompClient();
        sub = client.subscribe(WS_TOPICS.telemetry, (msg) => {
          const update = JSON.parse(msg.body);
          setSensors(prev => prev.map(s => s.id === update.id ? { ...s, ...update } : s));
        });
      })
      .catch((err) => {
        console.error('Broker connection failed:', err);
        setBrokerStatus('Offline');
      });

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const totalNodes = sensors.length;
  const onlineNodes = sensors.filter(n => n.status === 'online').length;
  const offlineNodes = sensors.filter(n => n.status === 'offline').length;

  const systemLoad = totalNodes > 0 
    ? Math.round((onlineNodes / totalNodes) * 100) 
    : 0;

  /**
   * Локалізує рядок формату ISO 8601 у зрозумілий для користувача формат часу.
   * @param isoString - Час останнього відгуку сенсора (ISO 8601).
   * @returns Відформатований рядок (наприклад, "14:30:00") або оригінальний рядок у разі помилки.
   */
  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-[#0a0a0f]">
        <div className="h-8 w-48 bg-[#1a1a24] rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-[#1a1a24] rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0a0a0f]">
      <div className="flex-1 overflow-y-auto p-6">

        {/* KPI блоки */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard title="Connected Nodes" value={onlineNodes} icon={Wifi} color="text-emerald-400" />
          <StatCard title="Offline Nodes" value={offlineNodes} icon={XCircle} color="text-red-400" />
          <StatCard title="System Load" value={`${systemLoad}%`} icon={Cpu} color="text-white" />
          <StatCard 
  title="Broker Status" 
  value={brokerStatus} 
  icon={Database} 
  color={brokerStatus === 'Healthy' ? "text-emerald-400" : brokerStatus === 'Connecting...' ? "text-yellow-400" : "text-red-400"} 
/>
        </div>

        {/* Таблиця сенсорів */}
        <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0a0a0f] text-xs text-[#71717a] uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Node ID</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Latency</th>
                <th className="px-4 py-3 text-left">Last Heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {sensors.map(node => (
                <tr key={node.id} className="border-t border-[#1a1a24] hover:bg-[#1a1a24]/50">
                  <td className="px-4 py-3 text-sm text-white font-mono">{node.id}</td>
                  <td className="px-4 py-3 text-sm text-[#71717a]">{node.location || '—'}</td>
                  <td className="px-4 py-3 text-left">
                    <StatusBadge status={node.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{node.latency} ms</td>
                  <td className="px-4 py-3 text-sm text-[#71717a]">{formatTime(node.lastHeartbeat)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Візуальний індикатор поточного статусу сенсора з відповідним кольоровим кодуванням.
 * @param props.status - Стан вузла (online, warning, offline).
 */
function StatusBadge({ status }: { status: string }) {
  const styles = {
    online: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20',
    warning: 'text-amber-400 bg-amber-400/10 border border-amber-400/20',
    offline: 'text-red-400 bg-red-400/10 border border-red-400/20'
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[status as keyof typeof styles] || styles.offline}`}>
      {status.toUpperCase()}
    </span>
  );
}

/**
 * Компонент картки для відображення ключових показників ефективності (KPI) мережі.
 * @param props.title - Назва показника (наприклад, "Connected Nodes").
 * @param props.value - Кількісне або текстове значення метрики.
 * @param props.icon - Іконка з бібліотеки Lucide.
 * @param props.color - CSS-клас для стилізації кольору тексту та іконки.
 */
function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2 text-[#71717a]">
        <Icon size={16} className={color} />
        <span className="text-xs">{title}</span>
      </div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}