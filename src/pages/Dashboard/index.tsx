import { TelemetryWidgets } from '../../components/TelemetryWidgets';
import { MapViewport } from '../../components/MapViewport';
import { AlertFeed } from '../../components/AlertFeed';
import { useAuth } from '../../hooks/useAuth';

export default function Dashboard() {
  const { isAdmin } = useAuth();
  
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden h-full">
      {/* Верхні віджети телеметрії (кількість нод, затримка, рівень шуму) */}
      {isAdmin && <TelemetryWidgets />}

      {/* Нижня частина: інтерактивна мапа та стрічка подій праворуч */}
      <div className="flex-1 flex overflow-hidden w-full">
        <MapViewport />
        {isAdmin && <AlertFeed />}
      </div>
    </div>
  );
}