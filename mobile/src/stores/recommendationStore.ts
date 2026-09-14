import { create } from 'zustand';

import { fetchRecommendations, searchPlaces } from '@/api/recommendations';
import type { Recommendation, RecommendationRequest } from '@/types';

interface RecommendationState {
  data: Recommendation | null;
  loading: boolean;
  error: string | null;
  submit: (request: RecommendationRequest) => Promise<boolean>;
  search: (query: string) => Promise<boolean>;
  clear: () => void;
}

function humanizeApiError(error: unknown): string {
  const raw = error instanceof Error ? error.message : 'Erro inesperado';
  const lower = raw.toLowerCase();
  if (
    lower.includes('rate_limit') ||
    lower.includes('tokens per day') ||
    lower.includes('cota diária') ||
    lower.includes('429')
  ) {
    return 'A cota diária da IA esgotou. Aguarde cerca de 30 minutos e tente de novo.';
  }
  if (lower.includes('groq http') || raw.length > 180) {
    return 'A IA está momentaneamente indisponível. Tente novamente em alguns instantes.';
  }
  return raw;
}

export const useRecommendationStore = create<RecommendationState>((set) => ({
  data: null,
  loading: false,
  error: null,

  submit: async (request) => {
    set({ loading: true, error: null, data: null });
    try {
      const data = await fetchRecommendations(request);
      set({ data, loading: false, error: null });
      return true;
    } catch (error) {
      set({
        loading: false,
        error: humanizeApiError(error),
      });
      return false;
    }
  },

  search: async (query) => {
    set({ loading: true, error: null, data: null });
    try {
      const data = await searchPlaces(query);
      set({ data, loading: false, error: null });
      return true;
    } catch (error) {
      set({
        loading: false,
        error: humanizeApiError(error),
      });
      return false;
    }
  },

  clear: () => set({ data: null, loading: false, error: null }),
}));
