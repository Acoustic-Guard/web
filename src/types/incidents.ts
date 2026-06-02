export interface IncidentMarker {

  id: string;

  lat: number; // Переходимо від відсотків Фігми до реальних гео-координат

  lng: number;

  type: 'UAV' | 'Explosion' | 'Siren' | 'Generator';

  intensity: number;

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