export interface Sensor {
  id: string;
  location: string;
  status: 'online' | 'offline' | 'warning';
  lastHeartbeat: string;
  noiseLevel: number;
}