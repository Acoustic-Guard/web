/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import districtGeoJson from '../constants/districtGeoJson.json';

import { useNoiseMap } from '../hooks/useNoiseMap';
import { useIncidentStream } from '../hooks/useIncidentStream';
import { useAuth } from '../hooks/useAuth';
import { useLiveIncidents } from '../hooks/useLiveIncidents';
import { MAP_CONFIG } from '../constants/mapConfig';
import { MARKER_COLORS } from '../constants/ThreatColors';
import { dbToColor, dbToOpacity, idwInterpolate } from '../constants/mapUtils';

import { IncidentDetailPanel } from './map-ui/IncidentDetailPanel';
import { IncidentStatsWidget } from './IncidentStatsWidget';
import { LayerControls } from './map-ui/LayerControls';
import { ZoomControls } from './map-ui/ZoomControls';
import { MapLegend } from './map-ui/MapLegend';
import { LocationControl } from './map-ui/LocationControl';
import { NoiseStatusPanel } from './map-ui/NoiseStatusPanel';
import { IncidentToast } from './map-ui/IncidentToast';
import { useNearbyIncidentToast } from '../hooks/useNearbyIncidentToast';
import { ZoomIn, ZoomOut, BarChart2 } from 'lucide-react';

export function MapViewport() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const { isAdmin } = useAuth();

  const heatLayerRef = useRef<any>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const noiseLayerRef = useRef<L.GeoJSON | null>(null);
  const publicOverlaysRef = useRef<L.SVGOverlay[]>([]);

  const [activeLayer, setActiveLayer] = useState<'heatmap' | 'noisemap' | 'none'>('heatmap');
  const [statsOpen, setStatsOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  const { liveIncidents, selectedIncident, setSelectedIncident, handleResolve, isResolving } = useLiveIncidents();
  const { toast, notify, dismiss } = useNearbyIncidentToast(userLocation);

  useIncidentStream({ onIncident: notify });
  const { points: apiNoisePoints } = useNoiseMap();
  const noisePoints = apiNoisePoints || [];


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
          color: 'transparent',
          fillColor: '#ef4444',
          fillOpacity: 0.15,
          className: 'blur-[16px] pointer-events-none transition-all duration-700'
        }
      }).addTo(map);

      const innerLayer = L.geoJSON(mergedInner as any, {
        style: {
          color: '#ef4444',
          weight: 1,
          opacity: 0.3,
          fillColor: '#ef4444',
          fillOpacity: 0.35,
          className: 'blur-[4px] pointer-events-none transition-all duration-700'
        }
      }).addTo(map);

      publicOverlaysRef.current.push(outerLayer as any, innerLayer as any);

    } catch (error) {
      console.error('Помилка генерації об\'єднаних зон радара:', error);
    }
  }, [liveIncidents, clearPublicOverlays]);

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

  useEffect(() => {
    if (isAdmin || activeLayer !== 'heatmap') { clearPublicOverlays(); return; }
    drawPublicZones();
  }, [liveIncidents, isAdmin, drawPublicZones, clearPublicOverlays, activeLayer]);

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
      radius: 60, blur: 50, maxZoom: 13, max: 1.0,
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

      {/* Drawer статистики — тільки адмін */}
      {isAdmin && (
        <>
          <IncidentStatsWidget
            incidents={liveIncidents}
            isOpen={statsOpen}
            onClose={() => setStatsOpen(false)}
          />
          {/* Закладка-кнопка */}
          <button
            onClick={() => setStatsOpen(!statsOpen)}
            style={{
              right: statsOpen ? '288px' : '0px',
              transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className="absolute top-1/2 -translate-y-1/2 z-[560] flex items-center gap-1.5 bg-[#1a1a24] hover:bg-[#2a2a34] border border-[#2a2a35] border-r-0 text-[#71717a] hover:text-white px-2 py-3 rounded-l-lg shadow-lg transition-colors"
          >
            <BarChart2 size={14} />
          </button>
        </>
      )}

      <LayerControls activeLayer={activeLayer} setActiveLayer={setActiveLayer} />
      <ZoomControls mapRef={mapRef} />
      <MapLegend activeLayer={activeLayer} />
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
        <button onClick={() => mapRef.current?.zoomIn()} className="w-10 h-10 bg-[#1a1a24] hover:bg-[#2a2a34] text-white rounded-lg flex items-center justify-center transition-colors"><ZoomIn size={18} /></button>
        <button onClick={() => mapRef.current?.zoomOut()} className="w-10 h-10 bg-[#1a1a24] hover:bg-[#2a2a34] text-white rounded-lg flex items-center justify-center transition-colors"><ZoomOut size={18} /></button>

        {!isAdmin && <LocationControl
          mapRef={mapRef}
          onLocationChange={(coords) => {
            setUserLocation(coords);
            if (coords) setLocationPermission('granted');
          }}
          onPermissionDenied={() => setLocationPermission('denied')}
        />}
      </div>

      {!isAdmin && (
        <>
          <IncidentToast toast={toast} onDismiss={dismiss} />
          <NoiseStatusPanel
            userLocation={userLocation}
            noisePoints={noisePoints}
            locationPermission={locationPermission}
          />
        </>
      )}
    </div>
  );
}