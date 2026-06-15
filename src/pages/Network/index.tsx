/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from 'react';
import { ensureConnected, getStompClient } from '../../services/stompClient';
import { fetchWithRetry, WS_TOPICS } from '../../config/api';
import { useConnection } from '../../context/ConnectionContext';
import { Wifi, XCircle, Cpu, Database, RefreshCw } from 'lucide-react';

/**
 * Sensor network node model.
 * Displays hardware status and connection quality of acoustic sensors.
 */
interface SensorNode {
  id: string;
  location: string;
  status: 'online' | 'offline' | 'warning';
  latencyMs: number;
  uptimePercent?: string;
  lastHeartbeat: string;
}

/**
 * Network Dashboard page.
 * Responsible for:
 * 1. Loading initial sensor state via REST API.
 * 2. Maintaining real-time data updates via WebSocket (STOMP).
 * 3. Displaying overall KPI and detailed sensor table.
 */
export default function NetworkPage() {
  const [sensors, setSensors] = useState<SensorNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brokerStatus, setBrokerStatus] = useState<'Healthy' | 'Offline' | 'Reconnecting...' | 'Connecting...'>('Connecting...');
  const [eventsPerMinute, setEventsPerMinute] = useState(0);
  const { isOnline } = useConnection();
  const previousIsOnline = useRef(true);
  const isInitialMount = useRef(true);

  const fetchSensors = () => {
    setLoading(true);
    setError(null);
    fetchWithRetry('/sensors')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log('Data from backend:', data);
       const sensorArray = Array.isArray(data) ? data : (data?.content || data?.sensors || []);
        
        if (sensorArray.length === 0) {
          console.warn('Backend returned empty array. No sensors available.');
          setSensors([]);
        } else {
          setSensors(sensorArray);
        }
      })
      .catch((err) => {
        console.error('Network load error:', err);
        setError('Failed to load sensor data. Please check your connection.');
        setSensors([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSensors();
  }, []);

  // Rehydrate data when connection is restored (false -> true transition)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!previousIsOnline.current && isOnline) {
      console.log('Connection restored, rehydrating sensor data with 2500ms delay');
      const timer = setTimeout(() => {
        fetchSensors();
      }, 2500);

      return () => clearTimeout(timer);
    }

    previousIsOnline.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    let sub: any;
    let telemetrySub: any;

    if (!isOnline) {
      // Cleanup subscriptions when offline
      return () => {
        if (sub) sub.unsubscribe();
        if (telemetrySub) telemetrySub.unsubscribe();
      };
    }

    ensureConnected()
      .then(() => {
        setBrokerStatus('Healthy');
        
        const client = getStompClient();
        
        // Subscribe to telemetry for events per minute
        telemetrySub = client.subscribe('/topic/telemetry', (msg) => {
          const telemetry = JSON.parse(msg.body);
          if (telemetry.eventsPerMinute !== undefined) {
            setEventsPerMinute(telemetry.eventsPerMinute);
          }
        });
        
        // Subscribe to sensors for real-time sensor updates
        sub = client.subscribe(WS_TOPICS.sensors, (msg) => {
          const update = JSON.parse(msg.body);
          setSensors(prev => prev.map(s => s.id === update.id ? { ...s, ...update } : s));
        });
      })
      .catch((err) => {
        console.error('Broker connection failed:', err);
        setBrokerStatus('Reconnecting...');
      });

    return () => {
      if (sub) sub.unsubscribe();
      if (telemetrySub) telemetrySub.unsubscribe();
    };
  }, [isOnline]);

  const onlineNodes = sensors.filter(n => n.status === 'online').length;
  const offlineNodes = sensors.filter(n => n.status === 'offline').length;

  /**
   * Localizes ISO 8601 timestamp string to user-friendly time format.
   * @param isoString - Sensor's last heartbeat time (ISO 8601).
   * @returns Formatted time string (e.g., "14:30:00") or original string on error.
   */
  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-[#0a0a0f]">
        <div className="flex flex-col items-center justify-center h-full">
          <RefreshCw className="animate-spin mb-4 text-[#71717a]" size={32} />
          <p className="text-[#71717a]">Loading network data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 bg-[#0a0a0f]">
        <div className="flex flex-col items-center justify-center h-full">
          <XCircle className="mb-4 text-red-400" size={32} />
          <p className="text-red-400 mb-2">Connection Error</p>
          <p className="text-[#71717a] text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#1a1a24] hover:bg-[#2a2a34] text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0a0a0f]">
      <div className="flex-1 overflow-y-auto p-6">

        {/* KPI blocks */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard title="Connected Nodes" value={onlineNodes} icon={Wifi} color="text-emerald-400" />
          <StatCard title="Offline Nodes" value={offlineNodes} icon={XCircle} color="text-red-400" />
          <StatCard title="Processing Load" value={`${eventsPerMinute} EPM`} icon={Cpu} color="text-white" />
          <StatCard 
  title="Broker Status" 
  value={brokerStatus} 
  icon={brokerStatus === 'Reconnecting...' ? RefreshCw : Database} 
  color={brokerStatus === 'Healthy' ? "text-emerald-400" : brokerStatus === 'Connecting...' ? "text-yellow-400" : brokerStatus === 'Reconnecting...' ? "text-yellow-400" : "text-red-400"} 
/>
        </div>

        {/* Sensor table */}
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
              {sensors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#71717a]">
                    No sensors available
                  </td>
                </tr>
              ) : (
                sensors.map(node => (
                  <tr key={node.id} className="border-t border-[#1a1a24] hover:bg-[#1a1a24]/50">
                    <td className="px-4 py-3 text-sm text-white font-mono">{node.id}</td>
                    <td className="px-4 py-3 text-sm text-[#71717a]">{node.location || '—'}</td>
                    <td className="px-4 py-3 text-left">
                      <StatusBadge status={node.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {node.status === 'offline' ? '-' : `${node.latencyMs} ms`}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#71717a]">{formatTime(node.lastHeartbeat)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Visual indicator of current sensor status with appropriate color coding.
 * @param props.status - Node status (online, warning, offline).
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
 * Component for displaying key performance indicators (KPI) cards.
 * @param props.title - Metric name (e.g., "Connected Nodes").
 * @param props.value - Quantitative or text metric value.
 * @param props.icon - Icon from Lucide library.
 * @param props.color - CSS class for styling text and icon colors.
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