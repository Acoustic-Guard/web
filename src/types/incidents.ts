/**
 * Маркер інциденту для відображення зафіксованих загроз на мапі.
 */
export interface IncidentMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'UAV' | 'Explosion' | 'Siren' | 'Generator';
  intensity: number;
  status?: string;
}

/**
 * Модель історичного запису про підтверджений або досліджений інцидент.
 */
export interface HistoricalIncident {
  id: string;
  datetime: string;
  type: 'UAV' | 'Siren' | 'Explosion' | 'Generator';
  coordinates: string;
  confidence: number;
  status: 'Resolved' | 'Investigating' | 'Confirmed';
}

/**
 * Модель оперативного попередження про поточну акустичну загрозу.
 */
export interface Alert {
  id: string;
  type: 'UAV' | 'Siren' | 'Explosion' | 'Generator';
  timestamp: string;
  confidence: number;
  location: string;
}

/**
 * Властивості компонента для відображення картки попередження.
 */
export interface AlertCardProps {
  alert: Alert;
}