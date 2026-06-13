import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MAP_CONFIG } from '../../constants/mapConfig';

export function useMapInit(mapContainerRef: React.RefObject<HTMLDivElement | null> , isDarkMap: boolean, isAdmin: boolean) {
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    
    const map = L.map(mapContainerRef.current, {
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.defaultZoom,
      zoomControl: false,
    });
    
    tileRef.current = L.tileLayer(isDarkMap ? MAP_CONFIG.tileUrl : MAP_CONFIG.tileUrlLight, {
      attribution: MAP_CONFIG.tileAttribution,
      maxZoom: MAP_CONFIG.maxZoom,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tileRef.current) return;
    tileRef.current.setUrl(isDarkMap ? MAP_CONFIG.tileUrl : MAP_CONFIG.tileUrlLight);
  }, [isDarkMap]);

  useEffect(() => {
    requestAnimationFrame(() => mapRef.current?.invalidateSize());
  }, [isAdmin]);

  return mapRef;
}