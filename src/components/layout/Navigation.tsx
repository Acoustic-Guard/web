import { useState } from 'react';
import { LockKeyhole, LogOut } from 'lucide-react';
import { NAV_ITEMS } from '../../constants/navItems';
import { useAuth } from '../../hooks/useAuth';
import { LoginModal } from '../auth/LoginModal';
import type { NavigationProps } from '../../types/navigation';

export function Navigation({ activeView, onViewChange }: NavigationProps) {
  const { isAdmin, user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <nav className="w-16 bg-[#0a0a0f] border-r border-[#1a1a24] flex flex-col items-center py-6">

        <div className="mb-6">
          <div className="w-10 h-10 bg-[#1a1a24] rounded-lg flex items-center justify-center">
            <span className="text-xs font-semibold text-white">AG</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  isActive
                    ? 'bg-[#2563eb] text-white'
                    : 'text-[#71717a] hover:text-white hover:bg-[#1a1a24]'
                }`}
                title={item.label}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-6 border-t border-[#1a1a24] w-full flex flex-col items-center gap-2">
          {isAdmin ? (
            <>
              <div
                className="w-10 h-10 rounded-lg bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center"
                title={`Оператор: ${user?.username}`}
              >
                <span className="text-xs font-semibold text-[#2563eb]">
                  {user?.username.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <button
                onClick={logout}
                className="w-10 h-10 rounded-lg text-[#71717a] hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                title="Вийти"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="w-10 h-10 rounded-lg text-[#52525b] hover:text-white hover:bg-[#1a1a24] flex items-center justify-center transition-colors"
              title="Вхід для оператора"
            >
              <LockKeyhole size={18} />
            </button>
          )}
        </div>
      </nav>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}