import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSwipeStore } from '@/stores/useSwipeStore';

/**
 * Component to initialize auth and load user data
 * This replaces the Context provider pattern with Zustand
 */
export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const initAuth = useAuthStore((state) => state.initAuth);
  const userId = useAuthStore((state) => state.userId);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const loadPreviousAnswers = useSwipeStore((state) => state.loadPreviousAnswers);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (userId && isInitialized) {
      loadPreviousAnswers(userId);
    }
  }, [userId, isInitialized, loadPreviousAnswers]);

  return <>{children}</>;
};
