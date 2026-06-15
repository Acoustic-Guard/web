import { useContext } from 'react';
import type { AuthContextValue } from '../types/auth';
import { AuthContext } from '../context/AuthContext';

/**
 * Convenient wrapper over useContext for safe access to authorization data.
 * Provides access to user profile, role, and session management methods.
 * @throws {Error} If used outside of AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}