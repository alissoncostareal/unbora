import type { Place } from './api';

export interface FavoriteItem extends Place {
  id: string;
  savedAt: string;
}

const STORAGE_KEY = 'unbora_user_favorites';

export function placeFavoriteId(place: Pick<Place, 'name' | 'address'>): string {
  const name = place.name.trim().toLowerCase();
  const address = (place.address ?? '').trim().toLowerCase();
  return `${name}::${address}`;
}

export function getFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
  } catch {
    return [];
  }
}

export function isPlaceFavorite(place: Pick<Place, 'name' | 'address'>): boolean {
  const id = placeFavoriteId(place);
  return getFavorites().some((item) => item.id === id);
}

export function togglePlaceFavorite(place: Place): boolean {
  if (typeof window === 'undefined') return false;
  const id = placeFavoriteId(place);
  const current = getFavorites();
  const existing = current.find((item) => item.id === id);

  let updated: FavoriteItem[];
  let isNowFavorite: boolean;

  if (existing) {
    updated = current.filter((item) => item.id !== id);
    isNowFavorite = false;
  } else {
    updated = [
      {
        ...place,
        id,
        savedAt: new Date().toISOString(),
      },
      ...current,
    ];
    isNowFavorite = true;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('unbora:favorites_changed', { detail: { favorites: updated } }));
  } catch (err) {
    console.warn('Erro ao salvar favoritos:', err);
  }

  return isNowFavorite;
}

export function removeFavorite(id: string): void {
  if (typeof window === 'undefined') return;
  const current = getFavorites();
  const updated = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('unbora:favorites_changed', { detail: { favorites: updated } }));
  } catch (err) {
    console.warn('Erro ao remover favorito:', err);
  }
}
