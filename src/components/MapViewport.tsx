import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Layers } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface IncidentMarker {
  id: string;
  lat: number; // Переходимо від відсотків Фігми до реальних гео-координат
  lng: number;
  type: 'UAV' | 'Explosion' | 'Siren' | 'Generator';
  intensity: number;
}

export function MapViewport() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Тестовий набір даних із координатами навколо Києва
  const [incidents] = useState<IncidentMarker[]>([
    { id: '1', lat: 50.4541, lng: 30.5284, type: 'UAV', intensity: 0.92 },
    { id: '2', lat: 50.4401, lng: 30.5134, type: 'Explosion', intensity: 0.88 },
    { id: '3', lat: 50.4601, lng: 30.4934, type: 'Siren', intensity: 0.76 },
    { id: '4', lat: 50.4321, lng: 30.5434, type: 'Generator', intensity: 0.64 },
    { id: '5', lat: 50.4712, lng: 30.5110, type: 'UAV', intensity: 0.81 },
  ]);

  const markerColors: Record<IncidentMarker['type'], string> = {
    UAV: 'bg-red-500',
    Explosion: 'bg-red-600',
    Siren: 'bg-amber-500',
    Generator: 'bg-yellow-500',
  };

  // 1. Ініціалізація карти
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Створення карти з центром у Києві. zoomControl: false ховає дефолтні кнопки
    const map = L.map(mapContainerRef.current, {
      center: [50.4501, 30.5234],
      zoom: 12,
      zoomControl: false,
    });

    // Додавання темної картографічної підкладки CartoDB DarkMatter під стиль дашборду
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // 2. Рендеринг маркерів (інтеграція стилів Фігми в Leaflet через L.divIcon)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markersGroup = L.layerGroup().addTo(map);

    incidents.forEach((incident) => {
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative w-3 h-3">
            <div class="w-3 h-3 ${markerColors[incident.type]} rounded-full shadow-lg animate-pulse"></div>
            <div class="absolute w-6 h-6 ${markerColors[incident.type]} rounded-full opacity-20 -top-1.5 -left-1.5 transform scale-100 hover:scale-150 transition-transform"></div>
          </div>
        `,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const marker = L.marker([incident.lat, incident.lng], { icon: customIcon });

      // Рендеринг кастомного тултіпу при наведенні
      marker.bindTooltip(`
        <div class="bg-[#0a0a0f]/95 backdrop-blur-sm border border-[#1a1a24] rounded px-2 py-1 text-white text-xs">
          <div class="font-semibold">${incident.type}</div>
          <div class="text-[#71717a]">Confidence: ${Math.round(incident.intensity * 100)}%</div>
        </div>
      `, { direction: 'top', className: 'leaflet-custom-tooltip', opacity: 1 });

      markersGroup.addLayer(marker);
    });

    return () => {
      markersGroup.remove();
    };
  }, [incidents]);

  // 3. Динамічний Canvas-рендеринг теплової карти шумового фону
  useEffect(() => {
    const map = mapRef.current;
    const canvas = canvasRef.current;
    if (!map || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawHeatmap = () => {
      // Підганяємо роздільну здатність канвасу під поточний розмір контейнера карти
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!showHeatmap) return;

      incidents.forEach((incident) => {
        // Конвертуємо гео-координати [lat, lng] у пікселі поточного вікна карти
        const point = map.latLngToContainerPoint([incident.lat, incident.lng]);
        
        // Масштабуємо радіус розмиття залежно від рівня зуму карти
        const currentZoom = map.getZoom();
        const baseRadius = 60;
        const radius = baseRadius * incident.intensity * (currentZoom / 12);

        if (radius <= 0) return;

        const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
        
        let rgb = '239, 68, 68'; // Red для UAV / Explosion
        if (incident.type === 'Siren') rgb = '245, 158, 11'; // Amber
        if (incident.type === 'Generator') rgb = '234, 179, 8'; // Yellow

        gradient.addColorStop(0, `rgba(${rgb}, 0.4)`);
        gradient.addColorStop(0.5, `rgba(${rgb}, 0.1)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    drawHeatmap();

    // Підписка на події мапи для динамічного перемальовування Canvas
    map.on('move zoom viewreset', drawHeatmap);

    return () => {
      map.off('move zoom viewreset', drawHeatmap);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [showHeatmap, incidents]);

  return (
    <div className="flex-1 bg-[#0f0f17] relative overflow-hidden h-full w-full">
      
      {/* Контейнер для карти Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Прозорий HTML5 Canvas шар для теплової карти поверх карти Leaflet */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-[400]" // Позиціонування між шаром тайлів і кнопками управління
      />

      {/* Кнопки інтерфейсу (Збережено розташування та стилі Фігми) */}
      <div className="absolute top-4 left-4 z-[500] flex gap-2">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            showHeatmap
              ? 'bg-[#2563eb] text-white'
              : 'bg-[#1a1a24] text-[#71717a] hover:text-white'
          }`}
        >
          <Layers size={14} />
          Heatmap
        </button>
      </div>

      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="w-10 h-10 bg-[#1a1a24] hover:bg-[#2a2a34] text-white rounded-lg flex items-center justify-center transition-colors"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="w-10 h-10 bg-[#1a1a24] hover:bg-[#2a2a34] text-white rounded-lg flex items-center justify-center transition-colors"
        >
          <ZoomOut size={18} />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-[500] bg-[#0a0a0f]/90 backdrop-blur-sm border border-[#1a1a24] rounded-lg p-3">
        <div className="text-xs text-[#71717a] mb-2">Map Legend</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-xs text-white">UAV Detected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            <span className="text-xs text-white">Explosion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-xs text-white">Siren</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-white">Generator</span>
          </div>
        </div>
      </div>

    </div>
  );
}