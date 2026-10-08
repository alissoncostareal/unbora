import { company, durations, interests, moods } from './catalog';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface GuideBudget {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export interface GuideData {
  moods: typeof moods;
  interests: typeof interests;
  company: typeof company;
  durations: typeof durations;
  budget: GuideBudget;
}

const fallbackBudget: GuideBudget = { min: 0, max: 300, step: 10, defaultValue: 80 };

const fallback: GuideData = {
  moods,
  interests,
  company,
  durations,
  budget: fallbackBudget,
};

let current = fallback;

export function getGuide(): GuideData {
  return current;
}

interface RemoteItem {
  id?: string;
  key?: string;
  label?: string;
  value?: string;
  line?: string;
  note?: string;
  searchHint?: string;
  active?: boolean;
}

interface RemoteGuide {
  moods?: RemoteItem[];
  interests?: RemoteItem[];
  company?: RemoteItem[];
  durations?: RemoteItem[];
  budget?: Partial<GuideBudget>;
}

function text(value: string | undefined, fallbackValue = '') {
  return value?.trim() || fallbackValue;
}

export async function loadGuide(): Promise<GuideData> {
  try {
    const response = await fetch(`${API_BASE}/guide`);
    if (!response.ok) return current;
    const data = (await response.json()) as RemoteGuide;
    const nextMoods = (data.moods ?? []).filter((item) => item.active !== false && item.label).map((item) => ({
      label: text(item.label),
      value: text(item.value, text(item.label)),
      line: text(item.line, 'Seu momento pede algo que combine com você.'),
      note: text(item.note),
    }));
    const nextInterests = (data.interests ?? []).filter((item) => item.active !== false && item.label).map((item) => ({
      id: text(item.key, text(item.id)),
      label: text(item.label),
      searchHint: text(item.searchHint, text(item.label)),
    }));
    const nextCompany = (data.company ?? []).filter((item) => item.active !== false && item.label).map((item) => ({
      label: text(item.label),
      value: text(item.value, text(item.label).toLowerCase()),
    }));
    const nextDurations = (data.durations ?? []).filter((item) => item.active !== false && item.label).map((item) => ({
      id: text(item.key, text(item.id)),
      label: text(item.label),
      value: text(item.value, text(item.label)),
    }));
    if (nextMoods.length === 0 || nextInterests.length === 0 || nextCompany.length === 0 || nextDurations.length === 0) {
      return current;
    }
    const budget = {
      min: data.budget?.min ?? fallbackBudget.min,
      max: data.budget?.max ?? fallbackBudget.max,
      step: data.budget?.step || fallbackBudget.step,
      defaultValue: data.budget?.defaultValue ?? fallbackBudget.defaultValue,
    };
    current = { moods: nextMoods, interests: nextInterests, company: nextCompany, durations: nextDurations, budget };
    return current;
  } catch {
    return current;
  }
}
