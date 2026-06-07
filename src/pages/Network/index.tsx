/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { getStompClient } from '../../services/stompClient';
import { fetchWithAuth, WS_TOPICS } from '../../config/api';
import { Wifi, XCircle, Cpu, Database } from 'lucide-react';

interface SensorNode {
  id: string;
  location: string;
  status: 'online' | 'offline' | 'warning';
  latency: number;
  uptime: string;
  lastHeartbeat: string;
}

export default function NetworkPage() {
  const [sensors, setSensors] = useState<SensorNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/sensors')
      .then((res) => {
        if (!res.ok) throw new Error('Not authorized');
        return res.json();
      })
      .then((data) => {
        // console.log('Дані від беку:', data);
        setSensors(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Network load error:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const client = getStompClient();
    if (!client?.connected) return;

    const sub = client.subscribe(WS_TOPICS.telemetry, (msg) => {
      const update = JSON.parse(msg.body);
      setSensors(prev => prev.map(s => s.id === update.id ? { ...s, ...update } : s));
    });

    return () => sub.unsubscribe();
  }, []);

  const onlineNodes = sensors.filter(n => n.status === 'online').length;
  const offlineNodes = sensors.filter(n => n.status === 'offline').length;
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
          <StatCard title="System Load" value="23%" icon={Cpu} color="text-white" />
          <StatCard title="Broker Status" value="Healthy" icon={Database} color="text-emerald-400" />
        </div>

        {/* Таблиця сенсорів */}
        <div className="bg-[#0f0f17] border border-[#1a1a24] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0a0a0f] text-xs text-[#71717a] uppercase">
              <tr>
                <th className="px-4 py-3">Node ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3">Last Heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {sensors.map(node => (
                <tr key={node.id} className="border-t border-[#1a1a24] hover:bg-[#1a1a24]/50">
                  <td className="px-4 py-3 text-sm text-white font-mono">{node.id}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={node.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{node.latency} ms</td>
                  <td className="px-4 py-3 text-sm text-[#71717a]">{node.lastHeartbeat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    online: 'text-emerald-400 bg-emerald-400/10',
    warning: 'text-amber-400 bg-amber-400/10',
    offline: 'text-red-400 bg-red-400/10'
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
      {status.toUpperCase()}
    </span>
  );
}

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