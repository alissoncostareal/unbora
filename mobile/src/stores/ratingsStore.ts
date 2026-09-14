import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { placeFavoriteId } from '@/stores/favoritesStore';
import type { Place } from '@/types';

export type RatedKind = 'place' | 'event';

export type RatedItem = {
  id: string;
  kind: RatedKind;
  name: string;
  subtitle?: string;
  type?: string;
  imageUrl?: string;
  stars: number;
  comment?: string;
  ratedAt: string;
  placeId?: string;
  googleMapsUri?: string;
};

export function ratingIdForPlace(place: Pick<Place, 'name' | 'address' | 'placeId'>): string {
  if (place.placeId?.trim()) return `place:${place.placeId.trim()}`;
  return `place:${placeFavoriteId(place)}`;
}

export function ratingIdForEvent(event: { id: string; title: string; venue?: string }): string {
  if (event.id?.trim()) return `event:${event.id.trim()}`;
  const title = event.title.trim().toLowerCase();
  const venue = (event.venue ?? '').trim().toLowerCase();
  return `event:${title}::${venue}`;
}

interface RatingsState {
  items: RatedItem[];
  getById: (id: string) => RatedItem | undefined;
  upsert: (item: Omit<RatedItem, 'ratedAt'> & { ratedAt?: string }) => void;
  remove: (id: string) => void;
}

export const useRatingsStore = create<RatingsState>()(
  persist(
    (set, get) => ({
      items: [],

      getById: (id) => get().items.find((item) => item.id === id),

      upsert: (item) => {
        const stars = Math.min(5, Math.max(1, Math.round(item.stars)));
        const next: RatedItem = {
          ...item,
          stars,
          ratedAt: item.ratedAt ?? new Date().toISOString(),
        };
        const without = get().items.filter((entry) => entry.id !== next.id);
        set({ items: [next, ...without] });
      },

      remove: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },
    }),
    {
      name: 'unbora-ratings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
