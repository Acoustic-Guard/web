import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { setConnectionCallbacks } from '../services/stompClient';

interface ConnectionContextValue {
  isOnline: boolean;
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

/**
 * Provider for global connection state.
 * Manages online/offline status with 5-second debounce for offline detection.
 * Integrates with STOMP WebSocket client to track connection state.
 */
export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set up connection callbacks with stompClient
    setConnectionCallbacks(
      () => {
        console.log('[ConnectionContext] State changed: isOnline = true');
        setIsOnline(true);
      },
      () => {
        console.log('[ConnectionContext] State changed: isOnline = false');
        setIsOnline(false);
      }
    );

    return () => {
      // Cleanup: reset callbacks when provider unmounts
      setConnectionCallbacks(() => {}, () => {});
    };
  }, []);

  return (
    <ConnectionContext.Provider value={{ isOnline }}>
      {children}
    </ConnectionContext.Provider>
  );
}

/**
 * Hook to access connection state.
 */
export function useConnection(): ConnectionContextValue {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnection must be used inside <ConnectionProvider>');
  return ctx;
}
