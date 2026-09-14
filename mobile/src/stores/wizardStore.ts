import { create } from 'zustand';

import { activityById } from '@/constants/wizardCatalog';
import type { RecommendationRequest } from '@/types';

interface WizardData {
  step: number;
  mood: string | null;
  feeling: string | null;
  activities: string[];
}

interface WizardState extends WizardData {
  showingResults: boolean;
  setStep: (step: number) => void;
  selectMood: (value: string) => void;
  selectFeeling: (value: string) => void;
  toggleActivity: (id: string) => void;
  showResults: () => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>((set, get) => ({
  step: 0,
  mood: null,
  feeling: null,
  activities: [],
  showingResults: false,

  setStep: (step) => set({ step }),
  showResults: () => set({ showingResults: true }),

  selectMood: (value) => set({ mood: value }),

  selectFeeling: (value) => set({ feeling: value }),

  toggleActivity: (id) => {
    const current = get().activities;
    set({
      activities: current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    });
  },

  reset: () => set({ step: 0, mood: null, feeling: null, activities: [], showingResults: false }),
}));

export function canProceed(state: WizardData): boolean {
  switch (state.step) {
    case 0:
      return !!state.mood;
    case 1:
      return !!state.feeling;
    default:
      return state.activities.length > 0;
  }
}

export function toRequest(
  state: WizardData,
  location?: {
    city?: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  },
): RecommendationRequest {
  return {
    humor: state.mood!,
    sentir: state.feeling!,
    city: location?.city,
    region: location?.region,
    country: location?.country,
    latitude: location?.latitude,
    longitude: location?.longitude,
    activities: state.activities.map((id) => {
      const activity = activityById[id];
      if (!activity) {
        throw new Error(`Atividade desconhecida: ${id}`);
      }

      return {
        id: activity.id,
        label: activity.value,
        searchHint: activity.searchHint,
      };
    }),
  };
}
