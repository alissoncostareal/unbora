import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getApiBaseUrl } from '@/api/client';
import {
  googleLoginUser,
  loginUser,
  mapBackendUser,
  registerMerchant as registerMerchantApi,
  registerUser,
  syncUser,
} from '@/api/users';
import type { AppUser } from '@/types';
import { createId } from '@/utils/id';

function createGuest(): AppUser {
  return {
    id: createId(),
    name: 'Convidado',
    email: '',
    isGuest: true,
    role: 'user',
  };
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts.length || !parts[0]) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

interface AuthState {
  user: AppUser | null;
  hydrated: boolean;
  bootstrap: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  registerMerchant: (
    name: string,
    email: string,
    password: string,
    businessName: string,
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (
    input:
      | { idToken?: string; email?: string; name?: string; googleId?: string }
      | string,
    name?: string,
    googleId?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      hydrated: false,

      bootstrap: async () => {
        if (__DEV__) {
          console.log('[Unbora] API:', getApiBaseUrl());
        }
        const current = get().user ?? createGuest();
        try {
          const synced = await syncUser(current, Platform.OS);
          set({ user: mapBackendUser(synced), hydrated: true });
        } catch {
          set({ user: current, hydrated: true });
        }
      },

      register: async (name, email, password) => {
        const user = await registerUser({
          name,
          email,
          password,
          platform: Platform.OS,
        });
        set({ user: mapBackendUser(user) });
      },

      registerMerchant: async (name, email, password, businessName) => {
        const user = await registerMerchantApi({
          name,
          email,
          password,
          businessName,
          platform: Platform.OS,
        });
        set({ user: mapBackendUser(user) });
      },

      login: async (email, password) => {
        const user = await loginUser({ email, password });
        set({ user: mapBackendUser(user) });
      },

      googleLogin: async (input, nameParam, googleIdParam) => {
        let payload: {
          idToken?: string;
          email?: string;
          name?: string;
          googleId?: string;
          platform?: string;
        };

        if (typeof input === 'string') {
          payload = {
            email: input,
            name: nameParam || 'Usuário Google',
            googleId: googleIdParam || 'google-user',
            platform: Platform.OS,
          };
        } else {
          payload = {
            ...input,
            platform: Platform.OS,
          };
        }

        const user = await googleLoginUser(payload);
        set({ user: mapBackendUser(user) });
      },

      logout: async () => {
        const guest = createGuest();
        try {
          const synced = await syncUser(guest, Platform.OS);
          set({ user: mapBackendUser(synced) });
        } catch {
          set({ user: guest });
        }
      },

      updateProfile: async (name) => {
        const { user } = get();
        if (!user || user.isGuest) {
          throw new Error('Crie uma conta para editar o perfil.');
        }

        const updated = { ...user, name: name.trim() };
        const synced = await syncUser(updated, Platform.OS);
        set({ user: mapBackendUser(synced) });
      },
    }),
    {
      name: 'unbora-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.bootstrap();
      },
    },
  ),
);
