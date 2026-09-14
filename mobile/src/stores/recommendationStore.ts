import { create } from 'zustand';

import { fetchRecommendations, searchPlaces } from '@/api/recommendations';
import type { Recommendation, RecommendationRequest } from '@/types';
import { log } from '@/utils/log';

interface RecommendationState {
  data: Recommendation | null;
  loading: boolean;
  error: string | null;
  submit: (request: RecommendationRequest) => Promise<boolean>;
  search: (query: string, city?: string, latitude?: number, longitude?: number) => Promise<boolean>;
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
    log.info('wizard', 'submit recomendação', {
      humor: request.humor,
      sentir: request.sentir,
      activities: request.activities?.map((a) => a.label ?? a.id),
      city: request.city,
    });
    set({ loading: true, error: null, data: null });
    try {
      const data = await fetchRecommendations(request);
      log.info('wizard', `ok — ${data.places.length} lugares`);
      set({ data, loading: false, error: null });
      return true;
    } catch (error) {
      const message = humanizeApiError(error);
      log.error('wizard', 'falha recomendação', message);
      set({
        loading: false,
        error: message,
      });
      return false;
    }
  },

  search: async (query, city, latitude, longitude) => {
    log.info('search', 'buscar', { query, city, latitude, longitude });
    set({ loading: true, error: null, data: null });
    try {
      const data = await searchPlaces(query, city, latitude, longitude);
      log.info('search', `ok — ${data.places.length} lugares`);
      set({ data, loading: false, error: null });
      return true;
    } catch (error) {
      const message = humanizeApiError(error);
      log.error('search', 'falha busca', message);
      set({
        loading: false,
        error: message,
      });
      return false;
    }
  },

  clear: () => {
    log.debug('recommend', 'limpar resultados');
    set({ data: null, loading: false, error: null });
  },
}));
