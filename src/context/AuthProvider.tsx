import { useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthUser, UserRole } from '../types/auth'; 
import { loginRequest } from '../services/AuthService';

/**
 * Provider component for global authorization state.
 * Responsible for:
 * 1. Initialization and persistence of session from local storage (localStorage).
 * 2. JWT token lifecycle management.
 * 3. Global interception of 'auth:unauthorized' event for automatic
 * system logout when token expires (401 Unauthorized).
 */
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
    } catch (error) {
      // Re-throw error to be handled by the calling component (LoginModal)
      throw error;
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

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
       window.location.href = '/'; 
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);
  
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
  
  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}