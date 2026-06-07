import { Map, BarChart3, Server } from 'lucide-react';
import type { NavItem } from '../types/navigation';

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Live Map', icon: Map },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'network',   label: 'Network', icon: Server },
];