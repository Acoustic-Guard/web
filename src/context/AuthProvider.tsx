import { useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthUser, UserRole } from '../types/auth'; 
import { loginRequest } from '../services/AuthService';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = localStorage.getItem('jwt_token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role') as UserRole;
    
    if (token && username && role) {
      return { username, role, token };
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  const login = async (username: string, pass: string) => {
    setLoading(true);
    try {
      const data = await loginRequest(username, pass);
      const role = data.role as UserRole;
      
      setUser({ username: data.username, role, token: data.token });
      
      if (data.token) {
        localStorage.setItem('jwt_token', data.token);
      }
      localStorage.setItem('username', data.username);
      localStorage.setItem('role', role);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
  };

  const isAdmin = user?.role === 'ADMIN';
  
  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}