import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      <Navigation activeView="dashboard" onViewChange={() => {}} />

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}