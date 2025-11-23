import { create } from 'zustand';
import { getCurrentUserId } from '@/services/sessionService';

interface AuthState {
  userId: string | null;
  isInitialized: boolean;
  initAuth: () => void;
  setUserId: (userId: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  isInitialized: false,

  initAuth: () => {
    // Read userId from localStorage instead of Supabase session
    const userId = getCurrentUserId();
    set({
      userId,
      isInitialized: true
    });
  },

  setUserId: (userId) => set({ userId }),

  clearAuth: () => set({ userId: null, isInitialized: false }),
}));
