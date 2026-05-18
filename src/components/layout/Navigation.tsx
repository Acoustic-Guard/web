import { Map, BarChart3, Server } from 'lucide-react';

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Navigation({ activeView, onViewChange }: NavigationProps) {
  const navItems = [
    { id: 'map', label: 'Live Map', icon: Map },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Network', icon: Server },
  ];

  return (
    <nav className="w-16 bg-[#0a0a0f] border-r border-[#1a1a24] flex flex-col items-center py-6 gap-6">
      <div className="mb-4">
        <div className="w-10 h-10 bg-[#1a1a24] rounded-lg flex items-center justify-center">
          <span className="text-xs font-semibold text-white">AG</span>
        </div>
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              isActive
                ? 'bg-[#2563eb] text-white'
                : 'text-[#71717a] hover:text-white hover:bg-[#1a1a24]'
            }`}
            title={item.label}
          >
            <Icon size={20} />
          </button>
        );
      })}
    </nav>
  );
}
