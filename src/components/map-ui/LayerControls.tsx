import { Layers, Radio } from 'lucide-react';

interface Props {
  activeLayer: string;
  setActiveLayer: (layer: 'heatmap' | 'noisemap' | 'none') => void;
}

export function LayerControls({ activeLayer, setActiveLayer }: Props) {
  return (
    <div className="absolute top-4 left-4 z-[500] flex flex-col gap-2">
      <button
        onClick={() => setActiveLayer(activeLayer === 'heatmap' ? 'none' : 'heatmap')}
        className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg ${
          activeLayer === 'heatmap'
            ? 'bg-[#2563eb] text-white'
            : 'bg-[#1a1a24] text-[#71717a] hover:text-white border border-[#333]'
        }`}
      >
        <Layers size={14} />
        Теплова карта
      </button>

      <button
        onClick={() => setActiveLayer(activeLayer === 'noisemap' ? 'none' : 'noisemap')}
        className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg ${
          activeLayer === 'noisemap'
            ? 'bg-[#8b5cf6] text-white'
            : 'bg-[#1a1a24] text-[#71717a] hover:text-white border border-[#333]'
        }`}
      >
        <Radio size={14} />
        Карта шуму
      </button>
    </div>
  );
}