import { company, durations, interests, moods, type JourneyChoice } from './catalog';

export interface ResultQuery {
  query: string;
  city: string;
  region: string;
  country: string;
  latitude?: number;
  longitude?: number;
  radiusKm: number;
  moodLabel: string;
  interestIds: string[];
  social: string;
  budgetReais: number;
  timeId: string;
}

function numberOrUndefined(value: string | null) {
  if (value == null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function readResultQuery(params: URLSearchParams): ResultQuery {
  return {
    query: params.get('q')?.trim() ?? '',
    city: params.get('city')?.trim() ?? '',
    region: params.get('region')?.trim() ?? '',
    country: params.get('country')?.trim() || 'Brasil',
    latitude: numberOrUndefined(params.get('lat')),
    longitude: numberOrUndefined(params.get('lng')),
    radiusKm: numberOrUndefined(params.get('radius')) ?? 8,
    moodLabel: params.get('mood')?.trim() ?? '',
    interestIds: (params.get('interests') ?? '').split(',').map((item) => item.trim()).filter(Boolean),
    social: params.get('social')?.trim() ?? '',
    budgetReais: numberOrUndefined(params.get('budget')) ?? 80,
    timeId: params.get('time')?.trim() ?? '',
  };
}

export function resultPath(input: {
  query?: string;
  city: string;
  region: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  moodLabel?: string;
  interestIds?: string[];
  social?: string;
  budgetReais?: number;
  timeId?: string;
}) {
  const params = new URLSearchParams();
  if (input.query) params.set('q', input.query);
  if (input.city) params.set('city', input.city);
  if (input.region) params.set('region', input.region);
  if (input.country) params.set('country', input.country);
  if (input.latitude != null) params.set('lat', String(input.latitude));
  if (input.longitude != null) params.set('lng', String(input.longitude));
  if (input.radiusKm != null) params.set('radius', String(input.radiusKm));
  if (input.moodLabel) params.set('mood', input.moodLabel);
  if (input.interestIds?.length) params.set('interests', input.interestIds.join(','));
  if (input.social) params.set('social', input.social);
  if (input.budgetReais != null) params.set('budget', String(input.budgetReais));
  if (input.timeId) params.set('time', input.timeId);
  const query = params.toString();
  return query ? `/results?${query}` : '/results';
}

export function journeyFromQuery(spec: ResultQuery): JourneyChoice | null {
  const mood = moods.find((item) => item.label === spec.moodLabel);
  const withWhom = company.find((item) => item.label === spec.social);
  const time = durations.find((item) => item.id === spec.timeId);
  if (!spec.city || !mood || !withWhom || !time) return null;
  return {
    moodLabel: mood.label,
    moodLine: mood.line,
    interests: interests.filter((item) => spec.interestIds.includes(item.id)).map((item) => item.label),
    social: withWhom.label,
    budgetReais: spec.budgetReais,
    time: time.label,
    city: spec.city,
    latitude: spec.latitude,
    longitude: spec.longitude,
    radiusKm: spec.radiusKm,
  };
}
