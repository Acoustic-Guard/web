/**
 * Словник кольорів (HEX) для візуальної диференціації типів загроз на графіках.
 */
export const THREAT_COLORS: Record<string, string> = {
  UAV: '#ef4444',
  Explosion: '#dc2626',
  Siren: '#f59e0b',
  Generator: '#eab308',
  Truck: '#3b82f6',
};

/**
 * Словник CSS-класів (Tailwind) для стилізації бейджів у компонентах попереджень.
 */
export const THREAT_BADGES: Record<string, string> = {
  UAV: 'bg-red-500/10 text-red-400 border-red-500/20',
  Explosion: 'bg-red-600/10 text-red-500 border-red-600/20',
  Siren: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Generator: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Truck: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

/**
 * Кольорове кодування життєвого циклу інцидентів (статусів обробки).
 */
export const STATUS_COLORS: Record<string, string> = {
  Resolved: 'text-emerald-400',
  Investigating: 'text-amber-400',
  Confirmed: 'text-red-400',
  Detected: 'text-blue-400',
};

/**
 * Локалізує ISO 8601 рядок часу у стандартний український формат дати та часу.
 * @param isoString - Вхідний рядок дати.
 * @returns Відформатований рядок (наприклад, "10.06.2026, 14:30:00").
 */
export const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString('uk-UA', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};