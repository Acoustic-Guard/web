import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

export default function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f] text-white">
      <Navigation/>

      <div className="flex-1 flex flex-col overflow-hidden">
        
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