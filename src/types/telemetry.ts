export interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'critical';
}

export interface SensorNode {
  id: string;
  location: string;
  status: 'online' | 'offline' | 'warning';
  latency: number;
  uptime: string;
  lastHeartbeat: string;
}

export interface SystemAlert {
  id: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}