import { useEffect, useRef, useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, Layers } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

import { useIncidents } from '../hooks/useIncidents';
import { useIncidentStream } from '../hooks/useIncidentStream';
import { MAP_CONFIG } from '../constants/mapConfig';
import { MARKER_COLORS } from '../constants/ThreatColors';

export function MapViewport() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatLayerRef = useRef<any>(null);

  const [showHeatmap, setShowHeatmap] = useState(true);
  
  // 1. Отримуємо статичні дані з REST API
  const { incidents: initialIncidents } = useIncidents();
  
  // 2. Стан ТІЛЬКИ для свіжих точок з веб-сокетів
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [wsIncidents, setWsIncidents] = useState<any[]>([]);

  // 3. Слухаємо веб-сокети
  useIncidentStream({
    onIncident: (newIncident) => {
      setWsIncidents((prev) => {
        const exists = prev.some((i) => i.id === newIncident.id);
        if (exists) {
          return prev.map((i) => (i.id === newIncident.id ? newIncident : i));
        }
        return [...prev, newIncident];
      });
    }
  });

  // 4. ДИНАМІЧНЕ ОБ'ЄДНАННЯ (Вирішує помилку ESLint)
  // Ми зливаємо initialIncidents та wsIncidents разом без використання useEffect
  const liveIncidents = useMemo(() => {
    const merged = [...initialIncidents];
    
    wsIncidents.forEach((wsInc) => {
      const idx = merged.findIndex(i => i.id === wsInc.id);
      if (idx !== -1) {
        merged[idx] = wsInc; // Оновлюємо існуючу точку
      } else {
        merged.push(wsInc); // Додаємо нову точку
      }
    });
    
    return merged;
  }, [initialIncidents, wsIncidents]);

  // 1. Ініціалізація карти
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.defaultZoom,
      zoomControl: false,
    });

    L.tileLayer(MAP_CONFIG.tileUrl, {
      attribution: MAP_CONFIG.tileAttribution,
      maxZoom: MAP_CONFIG.maxZoom,
    }).addTo(map);

    mapRef.current = map;
    return () => { map.remove(); };
  }, []);

  // 2. Маркери (використовуємо liveIncidents замість incidentList)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markersGroup = L.layerGroup().addTo(map);

    liveIncidents.forEach((incident) => {
      // Додаємо fallback колір на випадок, якщо тип загрози невідомий
      const colorClass = MARKER_COLORS[incident.type as keyof typeof MARKER_COLORS] || 'bg-gray-500';

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative w-3 h-3">
            <div class="w-3 h-3 ${colorClass} rounded-full shadow-lg animate-pulse"></div>
            <div class="absolute w-6 h-6 ${colorClass} rounded-full opacity-20 -top-1.5 -left-1.5"></div>
          </div>
        `,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const marker = L.marker([incident.lat, incident.lng], { icon: customIcon });
      marker.bindTooltip(`
        <div class="bg-[#0a0a0f]/95 border border-[#1a1a24] rounded px-2 py-1 text-white text-xs">
          <div class="font-semibold">${incident.type}</div>
          <div class="text-[#71717a]">Confidence: ${Math.round(incident.intensity * 100)}%</div>
        </div>
      `, { direction: 'top', className: 'leaflet-custom-tooltip', opacity: 1 });

      markersGroup.addLayer(marker);
    });

    return () => { markersGroup.remove(); };
  }, [liveIncidents]);

  // 3. leaflet-heat heatmap
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let animationFrameId: number;

    const renderHeatmap = () => {
     const size = map.getSize();
      if (size.x === 0 || size.y === 0) {
        animationFrameId = requestAnimationFrame(renderHeatmap);
        return;
      }

      if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
        map.removeLayer(heatLayerRef.current);
      }

      if (showHeatmap && liveIncidents.length > 0) {
        const heatPoints = liveIncidents.map((i) => [i.lat, i.lng, i.intensity]);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const heatLayer = (L as any).heatLayer(heatPoints, {
          radius: 50,
          blur: 35,
          maxZoom: 13,
          max: 1.0,
          gradient: {
            0.2: '#2563eb', 0.4: '#22c55e', 0.6: '#eab308', 0.8: '#f97316', 1.0: '#ef4444',
          },
        });

        heatLayer.addTo(map);
        heatLayerRef.current = heatLayer;
      }
    };

    renderHeatmap();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [liveIncidents, showHeatmap]);

  return (
    <div className="flex-1 bg-[#0f0f17] relative overflow-hidden h-full w-full min-w-[100px] min-h-[100px]">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      <div className="absolute top-4 left-4 z-[500] flex gap-2">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            showHeatmap ? 'bg-[#2563eb] text-white' : 'bg-[#1a1a24] text-[#71717a] hover:text-white'
          }`}
        >
          <Layers size={14} />
          Heatmap
        </button>
      </div>

      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
        <button onClick={() => mapRef.current?.zoomIn()} className="w-10 h-10 bg-[#1a1a24] hover:bg-[#2a2a34] text-white rounded-lg flex items-center justify-center transition-colors">
          <ZoomIn size={18} />
        </button>
        <button onClick={() => mapRef.current?.zoomOut()} className="w-10 h-10 bg-[#1a1a24] hover:bg-[#2a2a34] text-white rounded-lg flex items-center justify-center transition-colors">
          <ZoomOut size={18} />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-[500] bg-[#0a0a0f]/90 backdrop-blur-sm border border-[#1a1a24] rounded-lg p-3">
        <div className="text-xs text-[#71717a] mb-2">Map Legend</div>
        <div className="space-y-1.5">
          {[
            { color: 'bg-red-500',    label: 'UAV Detected' },
            { color: 'bg-red-600',    label: 'Explosion'    },
            { color: 'bg-amber-500',  label: 'Siren'        },
            { color: 'bg-yellow-500', label: 'Generator'    },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-2 h-2 ${color} rounded-full`}></div>
              <span className="text-xs text-white">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}