import { TelemetryWidgets } from '../../components/TelemetryWidgets';
import { MapViewport } from '../../components/MapViewport';
import { AlertFeed } from '../../components/AlertFeed';
import { useAuth } from '../../hooks/useAuth';

/**
 * Головний компонент робочої панелі (Dashboard) для моніторингу акустичної обстановки.
 * Інтегрує віджети телеметрії мережі, мапу просторового відображення інцидентів
 * та стрічку оперативних сповіщень. Використовує рольову модель доступу (RBAC) 
 * для контролю видимості адміністративних модулів.
 */
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