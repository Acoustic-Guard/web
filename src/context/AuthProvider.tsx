import { useState, useCallback, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthUser } from '../types/auth';
import { loginRequest, logoutRequest } from '../services/AuthService';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    const authUser = await loginRequest(username, password);
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    logoutRequest();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === 'admin', login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}