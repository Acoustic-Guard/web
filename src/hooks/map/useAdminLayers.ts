/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { MARKER_COLORS } from '../../constants/ThreatColors';

export function useAdminLayers(
  mapRef: React.MutableRefObject<L.Map | null>, 
  liveIncidents: any[], 
  isAdmin: boolean, 
  activeLayer: string, 
  setSelectedIncident: (incident: any) => void
) {
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<any>(null);

  // ── 1. Звичайні маркери
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!markersGroupRef.current) {
      markersGroupRef.current = L.layerGroup();
    }
    if (!map.hasLayer(markersGroupRef.current)) {
      markersGroupRef.current.addTo(map);
    }

    const group = markersGroupRef.current;

    if (!isAdmin) { 
      group.clearLayers(); 
      return; 
    }

    const existingMarkers = new Map<string, L.Marker>();
    group.getLayers().forEach((layer: any) => existingMarkers.set(layer.incidentId, layer));

    const currentIds = new Set(liveIncidents.map((i) => i.id));
    existingMarkers.forEach((marker, id) => {
      if (!currentIds.has(id)) { group.removeLayer(marker); existingMarkers.delete(id); }
    });

    liveIncidents.forEach((incident) => {
      const lat = incident.lat ?? incident.latitude;
      const lng = incident.lng ?? incident.longitude;
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
  }, [liveIncidents, isAdmin, mapRef, setSelectedIncident]);

  // ── 2. Теплова карта
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (activeLayer !== 'heatmap' || !isAdmin || liveIncidents.length === 0) {
      if (heatLayerRef.current) { map.removeLayer(heatLayerRef.current); heatLayerRef.current = null; }
      return;
    }

    const heatPoints = liveIncidents
      .filter((i: any) => i.lat != null || i.latitude != null)
      .map((i: any) => [i.lat ?? i.latitude, i.lng ?? i.longitude, i.intensity ?? 0.8]);

    if (heatLayerRef.current) map.removeLayer(heatLayerRef.current);
    heatLayerRef.current = (L as any).heatLayer(heatPoints, {
      radius: 60, 
      blur: 50, 
      maxZoom: 13, 
      max: 1.0,
      minOpacity: 0.4,
      gradient: { 0.2: '#2563eb', 0.4: '#22c55e', 0.6: '#eab308', 0.8: '#f97316', 1.0: '#ef4444' },
    }).addTo(map);
  }, [liveIncidents, activeLayer, isAdmin, mapRef]);

  // ── 3. Очищення сміття
  useEffect(() => {
    return () => {
      if (markersGroupRef.current && mapRef.current) mapRef.current.removeLayer(markersGroupRef.current);
      if (heatLayerRef.current && mapRef.current) mapRef.current.removeLayer(heatLayerRef.current);
      
     markersGroupRef.current = null;
      heatLayerRef.current = null;
    };
  }, [mapRef]);
}