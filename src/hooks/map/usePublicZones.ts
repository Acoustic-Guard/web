/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import * as turf from '@turf/turf';

export function usePublicZones(mapRef: React.MutableRefObject<L.Map | null>, liveIncidents: any[], isAdmin: boolean, activeLayer: string) {
  const publicOverlaysRef = useRef<L.SVGOverlay[]>([]);

  const clearPublicOverlays = useCallback(() => {
    const map = mapRef.current;
    publicOverlaysRef.current.forEach((ov) => { if (map) map.removeLayer(ov); });
    publicOverlaysRef.current = [];
  }, [mapRef]);

  const drawPublicZones = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    clearPublicOverlays();

    if (liveIncidents.length === 0) return;
    const validPoints = liveIncidents
      .filter((i: any) => (i.lat ?? i.latitude) != null && (i.lng ?? i.longitude) != null)
      .map((i: any) => turf.point([i.lng ?? i.longitude, i.lat ?? i.latitude]));

    if (validPoints.length === 0) return;
    const pointsCollection = turf.featureCollection(validPoints);

    try {
      const outerBuffer = turf.buffer(pointsCollection, 2.0, { units: 'kilometers' });
      const innerBuffer = turf.buffer(pointsCollection, 0.6, { units: 'kilometers' });

      if (!outerBuffer || !innerBuffer) return;

      const mergedOuter = turf.dissolve(outerBuffer as any);
      const mergedInner = turf.dissolve(innerBuffer as any);

      const outerLayer = L.geoJSON(mergedOuter as any, {
        style: {
          color: 'transparent', fillColor: '#ef4444', fillOpacity: 0.15,
          className: 'blur-[16px] pointer-events-none transition-all duration-700'
        }
      }).addTo(map);

      const innerLayer = L.geoJSON(mergedInner as any, {
        style: {
          color: '#ef4444', weight: 1, opacity: 0.3, fillColor: '#ef4444', fillOpacity: 0.35,
          className: 'blur-[4px] pointer-events-none transition-all duration-700'
        }
      }).addTo(map);

      publicOverlaysRef.current.push(outerLayer as any, innerLayer as any);
    } catch (error) {
      console.error('Помилка генерації об\'єднаних зон радара:', error);
    }
  }, [liveIncidents, clearPublicOverlays, mapRef]);

  useEffect(() => {
    if (isAdmin || activeLayer !== 'heatmap') { clearPublicOverlays(); return; }
    drawPublicZones();
  }, [liveIncidents, isAdmin, drawPublicZones, clearPublicOverlays, activeLayer]);

  useEffect(() => {
    return () => clearPublicOverlays();
  }, [clearPublicOverlays]);
}