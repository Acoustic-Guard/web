import { useRef, useState } from 'react';
import { Locate, Loader2 } from 'lucide-react';
import L from 'leaflet';

interface Props {
  mapRef: React.MutableRefObject<L.Map | null>;
}

export function LocationControl({ mapRef }: Props) {
  const [isLocating, setIsLocating] = useState(false);
const userMarkerRef = useRef<L.Marker | null>(null);

  const handleGeoLocation = () => {
    const map = mapRef.current;
    if (!map) return;

    // Перевіряємо, чи підтримує браузер геолокацію
    if (!navigator.geolocation) {
      alert('Геолокація не підтримується вашим браузером');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userIcon = L.divIcon({
          className: 'custom-user-location',
          html: `<div class="relative flex items-center justify-center w-4 h-4">
                  <div class="absolute w-full h-full bg-blue-500 rounded-full animate-ping opacity-60"></div>
                  <div class="relative w-3 h-3 bg-blue-600 border-2 border-white rounded-full shadow-md"></div>
                </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
        }
        
        map.flyTo([latitude, longitude], 16, {
          duration: 2, 
        });

        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        console.error('Помилка геолокації:', error);
        
        if (error.code === error.PERMISSION_DENIED) {
          alert('Будь ласка, дозвольте доступ до геолокації у налаштуваннях браузера.');
        } else {
          alert('Не вдалося визначити ваше місцезнаходження.');
        }
      },
      {
        enableHighAccuracy: true, 
        timeout: 5000,            
        maximumAge: 0 
      }
    );
  };

  return (
    <button
      onClick={handleGeoLocation}
      disabled={isLocating}
      title="Моє місцезнаходження"
      className="w-10 h-10 bg-[#1a1a24] hover:bg-[#2a2a34] text-white rounded-lg flex items-center justify-center transition-colors shadow-lg border border-[#2a2a35] disabled:opacity-50"
    >
      {isLocating ? (
        <Loader2 size={18} className="animate-spin text-purple-400" />
      ) : (
        <Locate size={18} className="hover:text-purple-400 transition-colors" />
      )}
    </button>
  );
}