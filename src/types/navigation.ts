import type { LucideIcon } from "lucide-react";

export interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}