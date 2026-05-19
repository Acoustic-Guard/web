import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Layers } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useIncidents } from '../hooks/useIncidents';
import { MARKER_COLORS, HEATMAP_RGB } from '../constants/ThreatColors';
import { MAP_CONFIG, HEATMAP_CONFIG } from '../constants/MapConfig';

export function MapViewport() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [showHeatmap, setShowHeatmap] = useState(true);
  const { incidents: incidentList } = useIncidents();

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

  // 2. Рендеринг маркерів
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markersGroup = L.layerGroup().addTo(map);

    incidentList.forEach((incident) => {
      const colorClass = MARKER_COLORS[incident.type];

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative w-3 h-3">
            <div class="w-3 h-3 ${colorClass} rounded-full shadow-lg animate-pulse"></div>
            <div class="absolute w-6 h-6 ${colorClass} rounded-full opacity-20 -top-1.5 -left-1.5 transform scale-100 hover:scale-150 transition-transform"></div>
          </div>
        `,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const marker = L.marker([incident.lat, incident.lng], { icon: customIcon });

      marker.bindTooltip(`
        <div class="bg-[#0a0a0f]/95 backdrop-blur-sm border border-[#1a1a24] rounded px-2 py-1 text-white text-xs">
          <div class="font-semibold">${incident.type}</div>
          <div class="text-[#71717a]">Confidence: ${Math.round(incident.intensity * 100)}%</div>
        </div>
      `, { direction: 'top', className: 'leaflet-custom-tooltip', opacity: 1 });

      markersGroup.addLayer(marker);
    });

    return () => { markersGroup.remove(); };
  }, [incidentList]);

  // 3. Canvas-рендеринг теплової карти
  useEffect(() => {
    const map = mapRef.current;
    const canvas = canvasRef.current;
    if (!map || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawHeatmap = () => {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!showHeatmap) return;

      incidentList.forEach((incident) => {
        const point = map.latLngToContainerPoint([incident.lat, incident.lng]);
        const radius = HEATMAP_CONFIG.baseRadius * incident.intensity * (map.getZoom() / MAP_CONFIG.defaultZoom);
        if (radius <= 0) return;

        const rgb = HEATMAP_RGB[incident.type];
        const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
        gradient.addColorStop(0,   `rgba(${rgb}, 0.4)`);
        gradient.addColorStop(0.5, `rgba(${rgb}, 0.1)`);
        gradient.addColorStop(1,   'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    drawHeatmap();
    map.on('move zoom viewreset', drawHeatmap);
    return () => {
      map.off('move zoom viewreset', drawHeatmap);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [showHeatmap, incidentList]);

  return (
    <div className="flex-1 bg-[#0f0f17] relative overflow-hidden h-full w-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-[400]" />

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