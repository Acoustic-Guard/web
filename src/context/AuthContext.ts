import { createContext } from 'react';
import type { AuthContextValue } from '../types/auth';

/**
 * Глобальний контекст для управління станом авторизації в React-застосунку.
 * Забезпечує типізований доступ до даних користувача та методів сесії 
 * через механізм React Context API, уникаючи prop-drilling.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);