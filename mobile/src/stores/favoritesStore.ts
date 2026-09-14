import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Place } from '@/types';

export type FavoritePlace = Place & {
  id: string;
  savedAt: string;
};

export function placeFavoriteId(place: Pick<Place, 'name' | 'address'>): string {
  const name = place.name.trim().toLowerCase();
  const address = (place.address ?? '').trim().toLowerCase();
  return `${name}::${address}`;
}

interface FavoritesState {
  items: FavoritePlace[];
  isFavorite: (place: Pick<Place, 'name' | 'address'>) => boolean;
  toggle: (place: Place) => void;
  remove: (id: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],

      isFavorite: (place) => {
        const id = placeFavoriteId(place);
        return get().items.some((item) => item.id === id);
      },

      toggle: (place) => {
        const id = placeFavoriteId(place);
        const existing = get().items.find((item) => item.id === id);
        if (existing) {
          set({ items: get().items.filter((item) => item.id !== id) });
          return;
        }
        set({
          items: [
            {
              ...place,
              id,
              savedAt: new Date().toISOString(),
            },
            ...get().items,
          ],
        });
      },

      remove: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },
    }),
    {
      name: 'unbora-favorites',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
