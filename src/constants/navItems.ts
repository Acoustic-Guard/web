import { Map, BarChart3, Server } from 'lucide-react';
import type { NavItem } from '../types/navigation';

export const NAV_ITEMS: NavItem[] = [
  { id: 'map',      label: 'Live Map',   icon: Map      },
  { id: 'analytics',label: 'Analytics',  icon: BarChart3 },
  { id: 'settings', label: 'Network',    icon: Server   },
];