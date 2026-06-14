/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import * as turf from '@turf/turf';

// ============================================================================
// ─── КОНФІГУРАЦІЯ КОЛЬОРІВ ──────────────────────────────────────────────────
// ============================================================================
const ZONE_COLORS: Record<string, string> = {
  UAV:       '#a855f7', // purple-500
  Explosion: '#ef4444', // red-500
  Siren:     '#f59e0b', // amber-500
  Generator: '#eab308', // yellow-500
  Truck:     '#3b82f6', // blue-500
};

// ============================================================================
// ─── ГОЛОВНИЙ ХУК ───────────────────────────────────────────────────────────
// ============================================================================
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

    const groupedPoints: Record<string, any[]> = {};
    
    liveIncidents.forEach((i: any) => {
      if ((i.lat ?? i.latitude) != null && (i.lng ?? i.longitude) != null) {
        const type = i.type || 'Explosion'; // Fallback на вибух
        if (!groupedPoints[type]) groupedPoints[type] = [];
        
        groupedPoints[type].push(turf.point([i.lng ?? i.longitude, i.lat ?? i.latitude]));
      }
    });

    Object.entries(groupedPoints).forEach(([type, points]) => {
      if (points.length === 0) return;
      
      const color = ZONE_COLORS[type] || '#ef4444';
      const pointsCollection = turf.featureCollection(points);

      try {
        const outerBuffer = turf.buffer(pointsCollection, 2.0, { units: 'kilometers' });
        const innerBuffer = turf.buffer(pointsCollection, 0.6, { units: 'kilometers' });

        if (!outerBuffer || !innerBuffer) return;

        const mergedOuter = turf.dissolve(outerBuffer as any);
        const mergedInner = turf.dissolve(innerBuffer as any);

        const outerLayer = L.geoJSON(mergedOuter as any, {
          style: {
            color: 'transparent', fillColor: color, fillOpacity: 0.15,
            className: 'blur-[16px] pointer-events-none transition-all duration-700'
          }
        }).addTo(map);

        const innerLayer = L.geoJSON(mergedInner as any, {
          style: {
            color: color, weight: 1, opacity: 0.3, fillColor: color, fillOpacity: 0.35,
            className: 'blur-[4px] pointer-events-none transition-all duration-700'
          }
        }).addTo(map);

        publicOverlaysRef.current.push(outerLayer as any, innerLayer as any);
      } catch (error) {
        console.error(`Помилка генерації об'єднаних зон для ${type}:`, error);
      }
    });

  }, [liveIncidents, clearPublicOverlays, mapRef]);

  useEffect(() => {
    if (isAdmin || activeLayer !== 'heatmap') { clearPublicOverlays(); return; }
    drawPublicZones();
  }, [liveIncidents, isAdmin, drawPublicZones, clearPublicOverlays, activeLayer]);

  useEffect(() => {
    return () => clearPublicOverlays();
  }, [clearPublicOverlays]);
}