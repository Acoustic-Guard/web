import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { useConnection } from '../../context/ConnectionContext';
import { AlertTriangle } from 'lucide-react';

export default function MainLayout() {
  const { isOnline } = useConnection();

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f] text-white">
      <Navigation/>

      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Global offline banner */}
        {!isOnline && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-sm text-amber-400">Connection to Hub lost. Reconnecting...</span>
          </div>
        )}

        <div className="bg-[#0a0a0f] border-b border-[#1a1a24] px-6 py-3">
          <h1 className="text-lg font-semibold">Acoustic Guard</h1>
          <p className="text-xs text-[#71717a]">Distributed Urban Acoustic Monitoring System</p>
        </div>

        <main className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}