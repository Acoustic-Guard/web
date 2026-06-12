import { useMemo } from 'react';
import { Volume2, VolumeX, MapPin, AlertTriangle } from 'lucide-react';

interface NoisePoint {
  latitude: number;
  longitude: number;
  db: number;
}

interface Props {
  userLocation: { lat: number; lng: number } | null;
  noisePoints: NoisePoint[];
  locationPermission: 'unknown' | 'granted' | 'denied';
}

const RADIUS_KM = 1.5;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getLocalDb(
  userLat: number,
  userLng: number,
  points: NoisePoint[]
): number | null {
  const nearby = points.filter(
    (p) => haversineKm(userLat, userLng, p.latitude, p.longitude) <= RADIUS_KM
  );
  if (!nearby.length) return null;

  // Зважене середнє — ближчі точки важать більше
  let weightedSum = 0;
  let totalWeight = 0;
  for (const p of nearby) {
    const dist = Math.max(haversineKm(userLat, userLng, p.latitude, p.longitude), 0.05);
    const w = 1 / dist ** 2;
    weightedSum += w * p.db;
    totalWeight += w;
  }
  return weightedSum / totalWeight;
}

type StatusLevel = 'quiet' | 'normal' | 'noisy' | 'loud' | 'danger';

function dbToStatus(db: number): StatusLevel {
  if (db < 45) return 'quiet';
  if (db < 55) return 'normal';
  if (db < 65) return 'noisy';
  if (db < 75) return 'loud';
  return 'danger';
}

const STATUS_CONFIG: Record<StatusLevel, {
  label: string;
  sub: string;
  iconColor: string;
  borderColor: string;
  bgColor: string;
  dotColor: string;
}> = {
  quiet:  { label: 'У вас тихо',         sub: 'Рівень шуму в нормі',          iconColor: 'text-emerald-400', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/5',  dotColor: 'bg-emerald-400' },
  normal: { label: 'Шум помірний',        sub: 'Прийнятний рівень для міста',  iconColor: 'text-blue-400',    borderColor: 'border-blue-500/30',    bgColor: 'bg-blue-500/5',    dotColor: 'bg-blue-400'    },
  noisy:  { label: 'Помітний шум',        sub: 'Рекомендується увага',         iconColor: 'text-yellow-400',  borderColor: 'border-yellow-500/30',  bgColor: 'bg-yellow-500/5',  dotColor: 'bg-yellow-400'  },
  loud:   { label: 'Гучно поруч',         sub: 'Підвищений рівень шуму',       iconColor: 'text-orange-400',  borderColor: 'border-orange-500/30',  bgColor: 'bg-orange-500/5',  dotColor: 'bg-orange-400'  },
  danger: { label: 'Небезпечний шум',     sub: 'Рекомендується залишити район',iconColor: 'text-red-400',     borderColor: 'border-red-500/30',     bgColor: 'bg-red-500/5',     dotColor: 'bg-red-400'     },
};

export function NoiseStatusPanel({ userLocation, noisePoints, locationPermission }: Props) {
  const localDb = useMemo(() => {
    if (!userLocation || !noisePoints.length) return null;
    return getLocalDb(userLocation.lat, userLocation.lng, noisePoints);
  }, [userLocation, noisePoints]);

  // ── Немає дозволу ──────────────────────────────────────────────────────────
  if (locationPermission === 'denied') {
    return (
      <div className="absolute bottom-4 right-4 z-[500] w-64 bg-[#0a0a0f]/95 backdrop-blur-md border border-[#1a1a24] rounded-xl p-3 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1a1a24] flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin size={15} className="text-[#71717a]" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold mb-0.5">Локацію не знайдено</p>
            <p className="text-[#71717a] text-[10px] leading-relaxed">
              Надайте доступ до геолокації щоб бачити рівень шуму у вашому районі
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Локація ще не надана (unknown) ─────────────────────────────────────────
  if (locationPermission === 'unknown' || !userLocation) {
    return (
      <div className="absolute bottom-4 right-4 z-[500] w-64 bg-[#0a0a0f]/95 backdrop-blur-md border border-[#1a1a24] rounded-xl p-3 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1a1a24] flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin size={15} className="text-[#71717a]" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold mb-0.5">Ваш район</p>
            <p className="text-[#71717a] text-[10px] leading-relaxed">
              Натисніть <span className="text-white">⊕</span> щоб дізнатись рівень шуму поруч з вами
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Локація є, але немає точок поблизу ────────────────────────────────────
  if (localDb === null) {
    return (
      <div className="absolute bottom-4 right-4 z-[500] w-64 bg-[#0a0a0f]/95 backdrop-blur-md border border-[#1a1a24] rounded-xl p-3 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1a1a24] flex items-center justify-center flex-shrink-0 mt-0.5">
            <VolumeX size={15} className="text-[#71717a]" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold mb-0.5">Даних немає</p>
            <p className="text-[#71717a] text-[10px] leading-relaxed">
              Сенсори поблизу вас не виявлені або знаходяться поза зоною покриття
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Є локація і дані ───────────────────────────────────────────────────────
  const status = dbToStatus(localDb);
  const cfg = STATUS_CONFIG[status];

  return (
    <div className={`absolute bottom-4 right-4 z-[500] w-64 bg-[#0a0a0f]/95 backdrop-blur-md border ${cfg.borderColor} ${cfg.bgColor} rounded-xl p-3 shadow-2xl transition-all duration-500`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg bg-[#1a1a24] flex items-center justify-center flex-shrink-0 mt-0.5 border ${cfg.borderColor}`}>
          {status === 'danger' || status === 'loud'
            ? <AlertTriangle size={15} className={cfg.iconColor} />
            : <Volume2 size={15} className={cfg.iconColor} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} flex-shrink-0`} />
            <p className={`text-xs font-semibold ${cfg.iconColor}`}>{cfg.label}</p>
          </div>
          <p className="text-[#71717a] text-[10px] leading-relaxed">{cfg.sub}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-sm font-mono font-semibold ${cfg.iconColor}`}>{Math.round(localDb)}</p>
          <p className="text-[#71717a] text-[9px]">дБ</p>
        </div>
      </div>
    </div>
  );
}