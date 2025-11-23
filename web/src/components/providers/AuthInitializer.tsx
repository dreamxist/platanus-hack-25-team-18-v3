import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Component to initialize auth from localStorage
 * Does NOT auto-load previous answers to allow fresh sessions
 */
export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return <>{children}</>;
};
