import type { Place } from './api';

export interface SavedRole {
  id: string;
  title: string;
  city: string;
  moodLabel?: string;
  savedAt: string;
  places: Place[];
}

const STORAGE_KEY = 'unbora_saved_roles';

export function getSavedRoles(): SavedRole[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedRole[]) : [];
  } catch {
    return [];
  }
}

export function saveRole(input: {
  title: string;
  city: string;
  moodLabel?: string;
  places: Place[];
}): SavedRole {
  const current = getSavedRoles();
  const newRole: SavedRole = {
    id: `role_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: input.title.trim() || `Rolê em ${input.city}`,
    city: input.city,
    moodLabel: input.moodLabel,
    savedAt: new Date().toISOString(),
    places: input.places,
  };

  const updated = [newRole, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('unbora:roles_changed', { detail: { roles: updated } }));
  } catch (err) {
    console.warn('Erro ao salvar rolê:', err);
  }

  return newRole;
}

export function removeSavedRole(id: string): void {
  if (typeof window === 'undefined') return;
  const current = getSavedRoles();
  const updated = current.filter((r) => r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('unbora:roles_changed', { detail: { roles: updated } }));
  } catch (err) {
    console.warn('Erro ao remover rolê:', err);
  }
}
