import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAdmin } = useAuth();

  if (requiredRole === 'admin' && !isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <p className="text-[#71717a] text-sm mb-1">Access denied</p>
          <p className="text-[#52525b] text-xs">Log in as an operator to view this page</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}