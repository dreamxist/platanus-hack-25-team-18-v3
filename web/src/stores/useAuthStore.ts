import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  userId: string | null;
  isInitialized: boolean;
  initAuth: () => Promise<void>;
  setUserId: (userId: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  isInitialized: false,

  initAuth: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    set({
      userId: user?.id || null,
      isInitialized: true
    });
  },

  setUserId: (userId) => set({ userId }),
}));
