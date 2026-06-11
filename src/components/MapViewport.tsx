/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import districtGeoJson from '../constants/districtGeoJson.json';

import { useNoiseMap } from '../hooks/useNoiseMap';
import { useAuth } from '../hooks/useAuth';
import { useLiveIncidents } from '../hooks/useLiveIncidents';
import { MAP_CONFIG } from '../constants/mapConfig';
import { MARKER_COLORS } from '../constants/ThreatColors';
import { dbToColor, dbToOpacity, idwInterpolate, intensityToRgb, ZONE_DEG } from '../constants/mapUtils';

import { IncidentDetailPanel } from './map-ui/IncidentDetailPanel';
import { LayerControls } from './map-ui/LayerControls';
import { ZoomControls } from './map-ui/ZoomControls';
import { MapLegend } from './map-ui/MapLegend';
import { STATIC_MOCK_NOISE_POINTS } from '../mocks/noisesMocks';

export function MapViewport() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const { isAdmin } = useAuth();

  const heatLayerRef      = useRef<any>(null);
  const markersGroupRef   = useRef<L.LayerGroup | null>(null);
  const noiseLayerRef     = useRef<L.GeoJSON | null>(null);
  const publicOverlaysRef = useRef<L.SVGOverlay[]>([]);

  const [activeLayer, setActiveLayer] = useState<'heatmap' | 'noisemap' | 'none'>('heatmap');

  const { liveIncidents, selectedIncident, setSelectedIncident, handleResolve, isResolving } = useLiveIncidents();
  const { points: apiNoisePoints } = useNoiseMap();
  const noisePoints = (apiNoisePoints && apiNoisePoints.length > 0) ? apiNoisePoints : STATIC_MOCK_NOISE_POINTS;

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

  const clearPublicOverlays = useCallback(() => {
    const map = mapRef.current;
    publicOverlaysRef.current.forEach((ov) => { if (map) map.removeLayer(ov); });
    publicOverlaysRef.current = [];
  }, []);

  const drawPublicZones = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    clearPublicOverlays();

    liveIncidents.forEach((incident, idx) => {
      const lat = incident.lat ?? incident.lat;
      const lng = incident.lng ?? incident.lng;
      if (lat == null || lng == null) return;

      const r      = ZONE_DEG;
      const bounds = L.latLngBounds([lat - r, lng - r], [lat + r, lng + r]);
      const rgb    = intensityToRgb(incident.intensity);
      const gradId = `pg-${idx}-${Date.now()}`;
      const svgNS  = 'http://www.w3.org/2000/svg';

      const svg  = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('xmlns', svgNS);
      svg.setAttribute('viewBox', '0 0 100 100');

      const defs = document.createElementNS(svgNS, 'defs');
      const grad = document.createElementNS(svgNS, 'radialGradient');
      grad.setAttribute('id', gradId);
      grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%'); grad.setAttribute('r', '50%');

      const stops: [string, number][] = [
        ['0%',   0.75 * incident.intensity],
        ['30%',  0.5  * incident.intensity],
        ['60%',  0.25 * incident.intensity],
        ['100%', 0],
      ];
      stops.forEach(([offset, opacity]) => {
        const stop = document.createElementNS(svgNS, 'stop');
        stop.setAttribute('offset', offset);
        stop.setAttribute('stop-color', `rgb(${rgb})`);
        stop.setAttribute('stop-opacity', String(Math.min(opacity, 1)));
        grad.appendChild(stop);
      });
      defs.appendChild(grad);
      svg.appendChild(defs);

      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', '50'); circle.setAttribute('cy', '50'); circle.setAttribute('r', '50');
      circle.setAttribute('fill', `url(#${gradId})`);
      svg.appendChild(circle);

      const overlay = L.svgOverlay(svg, bounds, { interactive: false, opacity: 1 });
      overlay.addTo(map);
      publicOverlaysRef.current.push(overlay);
    });
  }, [liveIncidents, clearPublicOverlays]);

  // ── Ініціалізація карти
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.defaultZoom,
      zoomControl: false,
    });
    L.tileLayer(MAP_CONFIG.tileUrl, { attribution: MAP_CONFIG.tileAttribution, maxZoom: MAP_CONFIG.maxZoom }).addTo(map);
    mapRef.current = map;

    return () => {
      clearPublicOverlays();
      if (heatLayerRef.current) map.removeLayer(heatLayerRef.current);
      if (markersGroupRef.current) map.removeLayer(markersGroupRef.current);
      if (noiseLayerRef.current) map.removeLayer(noiseLayerRef.current);
      map.remove();
      mapRef.current = null;
      heatLayerRef.current = null;
      markersGroupRef.current = null;
      noiseLayerRef.current = null;
    };
  }, [clearPublicOverlays]);

  // ── Публічні зони
  useEffect(() => {
    if (isAdmin || activeLayer !== 'heatmap') { clearPublicOverlays(); return; }
    drawPublicZones();
  }, [liveIncidents, isAdmin, drawPublicZones, clearPublicOverlays, activeLayer]);

  // ── Маркери (адмін)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!markersGroupRef.current) markersGroupRef.current = L.layerGroup().addTo(map);
    const group = markersGroupRef.current;

    if (!isAdmin) { group.clearLayers(); return; }

    const existingMarkers = new Map<string, L.Marker>();
    group.getLayers().forEach((layer: any) => existingMarkers.set(layer.incidentId, layer));

    const currentIds = new Set(liveIncidents.map((i) => i.id));
    existingMarkers.forEach((marker, id) => {
      if (!currentIds.has(id)) { group.removeLayer(marker); existingMarkers.delete(id); }
    });

    liveIncidents.forEach((incident) => {
      const lat = incident.lat ?? incident.lat;
      const lng = incident.lng ?? incident.lng;
      if (lat == null || lng == null || existingMarkers.has(incident.id)) return;

      const colorClass = MARKER_COLORS[incident.type as keyof typeof MARKER_COLORS] || 'bg-gray-500';
      const customIcon = L.divIcon({
        className: 'custom-div-icon cursor-pointer',
        html: `<div class="relative w-3 h-3"><div class="w-3 h-3 ${colorClass} rounded-full shadow-lg animate-pulse"></div><div class="absolute w-6 h-6 ${colorClass} rounded-full opacity-20 -top-1.5 -left-1.5"></div></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const marker: any = L.marker([lat, lng], { icon: customIcon });
      marker.incidentId = incident.id;
      marker.on('click', () => setSelectedIncident(incident));
      group.addLayer(marker);
    });
  }, [liveIncidents, isAdmin]);

  // ── Heatmap (адмін)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (activeLayer !== 'heatmap' || !isAdmin || liveIncidents.length === 0) {
      if (heatLayerRef.current) { map.removeLayer(heatLayerRef.current); heatLayerRef.current = null; }
      return;
    }

    const heatPoints = liveIncidents
      .filter((i: any) => i.lat != null || i.latitude != null)
      .map((i: any) => [i.lat ?? i.latitude, i.lng ?? i.longitude, i.intensity]);

    if (heatLayerRef.current) map.removeLayer(heatLayerRef.current);
    heatLayerRef.current = (L as any).heatLayer(heatPoints, {
      radius: 50, blur: 35, maxZoom: 13, max: 1.0,
      gradient: { 0.2: '#2563eb', 0.4: '#22c55e', 0.6: '#eab308', 0.8: '#f97316', 1.0: '#ef4444' },
    }).addTo(map);
  }, [liveIncidents, activeLayer, isAdmin]);

  // ── Noise Grid
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
  }, [noisePoints, activeLayer, baseClippedGrid]);

  useEffect(() => { requestAnimationFrame(() => mapRef.current?.invalidateSize()); }, [isAdmin]);

  return (
    <div className="flex-1 bg-[#0f0f17] relative overflow-hidden h-full w-full min-w-[100px] min-h-[100px]">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {isAdmin && (
        <IncidentDetailPanel
          selectedIncident={selectedIncident}
          setSelectedIncident={setSelectedIncident}
          handleResolve={handleResolve}
          isResolving={isResolving}
        />
      )}

      <LayerControls activeLayer={activeLayer} setActiveLayer={setActiveLayer} />
      <ZoomControls mapRef={mapRef} />
      <MapLegend activeLayer={activeLayer} />
    </div>
  );
}