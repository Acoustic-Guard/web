import { useContext } from 'react';
import type { AuthContextValue } from '../types/auth';
import { AuthContext } from '../context/AuthContext';

/**
 * Зручна обгортка над useContext для безпечного доступу до даних авторизації.
 * Забезпечує доступ до профілю користувача, його ролі та методів управління сесією.
 * @throws {Error} Якщо використовується поза межами AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}