/**
 * Властивості компонента картки для відображення статистичних показників.
 */
export interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'critical';
}

/**
 * Модель вузла сенсорів із детальними показниками працездатності мережі.
 */
export interface SensorNode {
  id: string;
  location: string;
  status: 'online' | 'offline' | 'warning';
  latency: number;
  uptime: string;
  lastHeartbeat: string;
}

/**
 * Модель системного сповіщення щодо стану апаратної частини чи зв'язку.
 */
export interface SystemAlert {
  id: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}