export interface IncidentMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'UAV' | 'Explosion' | 'Siren' | 'Generator';
  intensity: number;
  status?: string;
}


export interface HistoricalIncident {
  id: string;
  datetime: string;
  type: 'UAV' | 'Siren' | 'Explosion' | 'Generator';
  coordinates: string;
  confidence: number;
  status: 'Resolved' | 'Investigating' | 'Confirmed';
}



export interface Alert {
  id: string;
  type: 'UAV' | 'Siren' | 'Explosion' | 'Generator';
  timestamp: string;
  confidence: number;
  location: string;
}



export interface AlertCardProps {
  alert: Alert;
}