import type { LucideIcon } from "lucide-react";

/**
 * Властивості компонента навігації для перемикання між основними екранами.
 */
export interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

/**
 * Модель елемента навігаційного меню.
 */
export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}