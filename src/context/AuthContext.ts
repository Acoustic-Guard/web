import { createContext } from 'react';
import type { AuthContextValue } from '../types/auth';

/**
 * Global context for managing authorization state in React application.
 * Provides typed access to user data and session methods
 * through React Context API, avoiding prop-drilling.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);