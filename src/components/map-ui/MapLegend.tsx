interface Props {
  activeLayer: string;
}

export function MapLegend({ activeLayer }: Props) {
  return (
    <div className="absolute bottom-4 left-4 z-[500] bg-[#0a0a0f]/90 backdrop-blur-sm border border-[#1a1a24] rounded-lg p-3 pointer-events-none shadow-lg">
      <div className="text-xs text-[#71717a] mb-2">Legend</div>

      {activeLayer !== 'noisemap' && (
        <div className="space-y-1.5">
          {[
            { color: 'bg-purple-500',    label: 'UAV'        },
            { color: 'bg-red-600',    label: 'Exposion'       },
            { color: 'bg-amber-500',  label: 'Siren'       },
            { color: 'bg-yellow-500', label: 'Generator'   },
            { color: 'bg-blue-500',   label: 'Truck'   },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-2 h-2 ${color} rounded-full`} />
              <span className="text-xs text-white">{label}</span>
            </div>
          ))}
        </div>
      )}

      {activeLayer === 'noisemap' && (
        <>
          <div className="text-[10px] text-[#71717a] mb-2">Noise level (dB)</div>
          <div className="space-y-1.5">
            {[
              { color: 'bg-green-500',  label: '< 45 — silence'     },
              { color: 'bg-blue-500',   label: '45–55 — normal'    },
              { color: 'bg-yellow-500', label: '55–65 — notably'  },
              { color: 'bg-orange-500', label: '65–75 — loud'    },
              { color: 'bg-red-500',    label: '> 75 — danger' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-2 h-2 ${color} rounded`} />
                <span className="text-xs text-white">{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}