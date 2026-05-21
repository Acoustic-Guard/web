import { TelemetryWidgets } from '../../components/TelemetryWidgets';
import { MapViewport } from '../../components/MapViewport';
import { AlertFeed } from '../../components/AlertFeed';

export default function Dashboard() {
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden h-full">
      {/* Верхні віджети телеметрії (кількість нод, затримка, рівень шуму) */}
      <TelemetryWidgets />

      {/* Нижня частина: інтерактивна мапа та стрічка подій праворуч */}
      <div className="flex-1 flex overflow-hidden w-full">
        <MapViewport />
        <AlertFeed />
      </div>
    </div>
  );
}