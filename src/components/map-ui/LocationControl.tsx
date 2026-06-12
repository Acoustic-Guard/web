import { useRef, useState, useEffect } from 'react';
import { Locate, Loader2 } from 'lucide-react';
import L from 'leaflet';

interface Props {
  mapRef: React.MutableRefObject<L.Map | null>;
  onLocationChange: (coords: { lat: number; lng: number } | null) => void;
  onPermissionDenied?: () => void;
}

export function LocationControl({ mapRef, onLocationChange, onPermissionDenied }: Props) {
  const [isLocating, setIsLocating] = useState(false);
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const userMarkerRef = useRef<L.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Перевіряємо поточний стан дозволу при монтуванні
  useEffect(() => {
    if (!navigator.permissions) return;
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') setPermissionState('granted');
      if (result.state === 'denied') {
        setPermissionState('denied');
        onLocationChange(null);
      }
      result.onchange = () => {
        if (result.state === 'denied') {
          setPermissionState('denied');
          onLocationChange(null);
          onPermissionDenied?.();
        }
      };
    });

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [onLocationChange]);

  const startTracking = (map: L.Map) => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPermissionState('granted');
        onLocationChange({ lat: latitude, lng: longitude });

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
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied');
          onLocationChange(null);
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  };

const handleGeoLocation = () => {
    const map = mapRef.current;
    if (!map) return;

    if (!navigator.geolocation) {
      alert('Геолокація не підтримується вашим браузером');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPermissionState('granted');
        setIsLocating(false);
        onLocationChange({ lat: latitude, lng: longitude });

        map.flyTo([latitude, longitude], 15, { duration: 2 });
        startTracking(map);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied');
          onLocationChange(null);
          onPermissionDenied?.();
          alert('Будь ласка, дозвольте доступ до геолокації у налаштуваннях браузера.');
        } else {
          alert('Не вдалося визначити ваше місцезнаходження.');
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return (
    <button
      onClick={handleGeoLocation}
      disabled={isLocating || permissionState === 'denied'}
      title={permissionState === 'denied' ? 'Доступ до геолокації заблоковано' : 'Моє місцезнаходження'}
      className="w-10 h-10 bg-[#1a1a24] hover:bg-[#2a2a34] text-white rounded-lg flex items-center justify-center transition-colors shadow-lg border border-[#2a2a35] disabled:opacity-50"
    >
      {isLocating ? (
        <Loader2 size={18} className="animate-spin text-purple-400" />
      ) : (
        <Locate
          size={18}
          className={permissionState === 'granted' ? 'text-blue-400' : 'hover:text-purple-400 transition-colors'}
        />
      )}
    </button>
  );
}