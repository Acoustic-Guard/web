/* eslint-disable react-hooks/purity */
import { useEffect, useRef, useState } from 'react';
import type { IncidentMarker } from '../types/incidents';

const RADIUS_KM = 4;
const TOAST_DURATION_MS = 6000;


/**
 * Обчислює дистанцію між користувачем та зафіксованим інцидентом 
 * з використанням математичної формули гаверсину (Haversine formula).
 * * @param lat1, lng1 - Координати першої точки.
 * @param lat2, lng2 - Координати другої точки.
 * @returns Відстань у кілометрах.
 */
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

export interface ToastIncident {
  id: string;
  type: IncidentMarker['type'];
  distanceKm: number;
  intensity: number;
}

/**
 * Геопросторовий хук для системи сповіщень.
 * Відстежує появу нових інцидентів і генерує спливаюче повідомлення (Toast), 
 * лише якщо загроза зафіксована у визначеному радіусі від поточної локації користувача.
 * * @param userLocation - Поточні географічні координати клієнта.
 */
export function useNearbyIncidentToast(userLocation: { lat: number; lng: number } | null) {
  const [toast, setToast] = useState<ToastIncident | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userLocationRef = useRef(userLocation);
  const shownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);

  const dismiss = () => {
    setToast(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const notify = (incident: IncidentMarker) => {
        if (shownIdsRef.current.has(incident.id)) return;

    const loc = userLocationRef.current;
    if (!loc) return;

    const lat = incident.lat;
    const lng = incident.lng;
    if (lat == null || lng == null) return;

    const dist = haversineKm(loc.lat, loc.lng, lat, lng);
    if (dist > RADIUS_KM) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    setToast({ id: incident.id, type: incident.type, distanceKm: dist, intensity: incident.intensity });

    timerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { toast, notify, dismiss };
}