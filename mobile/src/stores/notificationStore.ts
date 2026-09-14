import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { fetchNotifications, type NotificationItem } from '@/api/notifications';
import { useLocationStore } from '@/stores/locationStore';

const STORAGE_KEY = 'unbora-notifications';

interface NotificationState {
  items: NotificationItem[];
  readIds: string[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      items: [],
      readIds: [],
      loading: false,
      error: null,
      lastFetchedAt: null,
      refresh: async () => {
        const { city, region } = useLocationStore.getState();
        set({ loading: true, error: null });
        try {
          const items = await fetchNotifications(city, region);
          set({ items, loading: false, lastFetchedAt: new Date().toISOString() });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Erro ao carregar notificações',
          });
        }
      },
      markAsRead: (id) => {
        const readIds = get().readIds;
        if (readIds.includes(id)) return;
        set({ readIds: [...readIds, id] });
      },
      markAllAsRead: () => {
        const ids = get().items.map((item) => item.id);
        set({ readIds: Array.from(new Set([...get().readIds, ...ids])) });
      },
      unreadCount: () => {
        const { items, readIds } = get();
        return items.filter((item) => !readIds.includes(item.id)).length;
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        readIds: state.readIds,
        lastFetchedAt: state.lastFetchedAt,
      }),
    },
  ),
);
