/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import districtGeoJson from '../../constants/districtGeoJson.json';
import { dbToColor, dbToOpacity, idwInterpolate } from '../../constants/mapUtils';

export function useNoiseLayer(mapRef: React.MutableRefObject<L.Map | null>, noisePoints: any[], activeLayer: string) {
  const noiseLayerRef = useRef<L.GeoJSON | null>(null);

  const baseClippedGrid = useMemo(() => {
    const districtPolygon = turf.polygon(districtGeoJson.features[0].geometry.coordinates);
    const bbox = turf.bbox(districtPolygon);
    const rawGrid = turf.hexGrid(bbox, 0.45, { units: 'kilometers' });

    const clippedFeatures: Feature<Polygon | MultiPolygon>[] = [];

    for (const hex of rawGrid.features) {
      const clipped = turf.intersect(turf.featureCollection([hex, districtPolygon]));
      if (!clipped) continue;

      const center = turf.centerOfMass(hex);
      clipped.properties = {
        centerLng: center.geometry.coordinates[0],
        centerLat: center.geometry.coordinates[1]
      };
      clippedFeatures.push(clipped as Feature<Polygon | MultiPolygon>);
    }

    return clippedFeatures;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (activeLayer !== 'noisemap') {
      if (noiseLayerRef.current) { map.removeLayer(noiseLayerRef.current); noiseLayerRef.current = null; }
      return;
    }

    const timer = setTimeout(() => {
      const finalFeatures = baseClippedGrid.map(feature => {
        const lng = feature.properties!.centerLng;
        const lat = feature.properties!.centerLat;
        const db = idwInterpolate(lng, lat, noisePoints, 2.5, 2, 38);

        return {
          ...feature,
          properties: { ...feature.properties, db }
        };
      });

      if (noiseLayerRef.current) map.removeLayer(noiseLayerRef.current);

      noiseLayerRef.current = L.geoJSON(turf.featureCollection(finalFeatures) as any, {
        style: (feature: any) => {
          const db: number = feature?.properties?.db ?? 38;
          return {
            fillColor: dbToColor(db),
            fillOpacity: dbToOpacity(db),
            color: '#0f0f17',
            weight: 1,
            opacity: 0.5,
          };
        },
      }).addTo(map);
    }, 10);

    return () => clearTimeout(timer);
  }, [noisePoints, activeLayer, baseClippedGrid, mapRef]);

  useEffect(() => {
    return () => {
      if (noiseLayerRef.current && mapRef.current) mapRef.current.removeLayer(noiseLayerRef.current);
    };
  }, [mapRef]);
}