import type { JourneyChoice } from './catalog';
import { getGuide } from './guide';

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

function normalizeKey(value: string | undefined | null) {
  if (!value) return '';
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function journeyFromQuery(spec: ResultQuery): JourneyChoice | null {
  if (!spec.city) return null;
  const { moods: gMoods, company: gCompany, durations: gDurations, interests: gInterests } = getGuide();
  if (!gMoods.length || !gCompany.length || !gDurations.length) return null;

  const normMood = normalizeKey(spec.moodLabel);
  const mood = gMoods.find((item) => normalizeKey(item.label) === normMood || normalizeKey(item.value).includes(normMood))
    || gMoods[0];

  const normSocial = normalizeKey(spec.social);
  const withWhom = gCompany.find((item) => normalizeKey(item.label) === normSocial || normalizeKey(item.value) === normSocial)
    || gCompany[1] || gCompany[0];

  const normTime = normalizeKey(spec.timeId);
  const time = gDurations.find((item) => item.id === spec.timeId || normalizeKey(item.label) === normTime || normalizeKey(item.value).includes(normTime))
    || gDurations[2] || gDurations[0];

  const matchedInterests = gInterests.filter((item) =>
    spec.interestIds.some((id) => {
      const nid = normalizeKey(id);
      return normalizeKey(item.id) === nid || normalizeKey(item.label) === nid;
    })
  );
  const activeInterests = (matchedInterests.length > 0 ? matchedInterests : [gInterests[2] || gInterests[0]]).map((item) => item.label);

  return {
    moodLabel: mood.label,
    moodLine: mood.line,
    interests: activeInterests,
    social: withWhom.label,
    budgetReais: spec.budgetReais,
    time: time.label,
    city: spec.city,
    latitude: spec.latitude,
    longitude: spec.longitude,
    radiusKm: spec.radiusKm,
  };
}
