import { useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

// Custom Hooks (UI)
import { useNoiseMap } from '../hooks/useNoiseMap';
import { useIncidentStream } from '../hooks/useIncidentStream';
import { useAuth } from '../hooks/useAuth';
import { useLiveIncidents } from '../hooks/useLiveIncidents';
import { useNearbyIncidentToast } from '../hooks/useNearbyIncidentToast';

// Custom Hooks (Map Logic)
import { useMapInit } from '../hooks/map/useMapInit';
import { usePublicZones } from '../hooks/map/usePublicZones';
import { useAdminLayers } from '../hooks/map/useAdminLayers';
import { useNoiseLayer } from '../hooks/map/useNoiseLayer';

// UI Components
import { IncidentDetailPanel } from './map-ui/IncidentDetailPanel';
import { IncidentStatsWidget } from './IncidentStatsWidget';
import { LayerControls } from './map-ui/LayerControls';
import { MapLegend } from './map-ui/MapLegend';
import { LocationControl } from './map-ui/LocationControl';
import { NoiseStatusPanel } from './map-ui/NoiseStatusPanel';
import { IncidentToast } from './map-ui/IncidentToast';
import { ZoomIn, ZoomOut, BarChart2, Moon, Sun } from 'lucide-react';

/**
 * Головний контейнер (Viewport) інтерактивної карти Leaflet.
 * Відповідає за агрегацію хуків логіки шарів (Public, Admin, Noise) 
 * та вивід поверх них інтерфейсу (елементи керування, легенда, нотифікації).
 */
export function MapViewport() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const { isAdmin } = useAuth();
  const [activeLayer, setActiveLayer] = useState<'heatmap' | 'noisemap' | 'none'>('heatmap');
  const [statsOpen, setStatsOpen] = useState(false);
  const [isDarkMap, setIsDarkMap] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  const { liveIncidents, selectedIncident, setSelectedIncident, handleResolve, isResolving } = useLiveIncidents();
  const { toast, notify, dismiss } = useNearbyIncidentToast(userLocation);
  useIncidentStream({ onIncident: notify });
  
  const { points: apiNoisePoints } = useNoiseMap();
  const noisePoints = apiNoisePoints || [];

  const mapRef = useMapInit(mapContainerRef, isDarkMap, isAdmin);
  usePublicZones(mapRef, liveIncidents, isAdmin, activeLayer);
  useAdminLayers(mapRef, liveIncidents, isAdmin, activeLayer, setSelectedIncident);
  useNoiseLayer(mapRef, noisePoints, activeLayer);

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

      {isAdmin && (
        <>
          <IncidentStatsWidget
            incidents={liveIncidents}
            isOpen={statsOpen}
            onClose={() => setStatsOpen(false)}
          />
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
      <MapLegend activeLayer={activeLayer} />

      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
        <button onClick={() => mapRef.current?.zoomIn()} className="w-10 h-10 bg-[#1a1a24] hover:bg-[#2a2a34] text-white rounded-lg flex items-center justify-center transition-colors"><ZoomIn size={18} /></button>
        <button onClick={() => mapRef.current?.zoomOut()} className="w-10 h-10 bg-[#1a1a24] hover:bg-[#2a2a34] text-white rounded-lg flex items-center justify-center transition-colors"><ZoomOut size={18} /></button>

        <button
          onClick={() => setIsDarkMap(!isDarkMap)}
          className="w-10 h-10 bg-[#1a1a24] hover:bg-[#2a2a34] text-white rounded-lg flex items-center justify-center transition-colors border border-[#2a2a35]"
          title={isDarkMap ? 'Світла карта' : 'Темна карта'}
        >
          {isDarkMap ? <Sun size={18} /> : <Moon size={18} />}
        </button>

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