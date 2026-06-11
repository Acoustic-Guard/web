import { ZoomIn, ZoomOut } from 'lucide-react';
import L from 'leaflet';

interface Props {
  mapRef: React.MutableRefObject<L.Map | null>;
}

export function ZoomControls({ mapRef }: Props) {
  return (
    <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
      <button onClick={() => mapRef.current?.zoomIn()} className="w-10 h-10 bg-[#1a1a24] hover:bg-[#2a2a34] text-white rounded-lg flex items-center justify-center transition-colors">
        <ZoomIn size={18} />
      </button>
      <button onClick={() => mapRef.current?.zoomOut()} className="w-10 h-10 bg-[#1a1a24] hover:bg-[#2a2a34] text-white rounded-lg flex items-center justify-center transition-colors">
        <ZoomOut size={18} />
      </button>
    </div>
  );
}