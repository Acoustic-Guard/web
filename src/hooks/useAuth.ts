import { useContext } from 'react';
import type { AuthContextValue } from '../types/auth';
import { AuthContext } from '../context/AuthContext';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}