import { apiGet } from '@/api/client';

export interface CitySuggestion {
  city: string;
  region: string;
  country: string;
  label: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface LocationCatalog {
  defaultCity: string;
  defaultRegion: string;
  cities: { city: string; region: string }[];
}

export async function suggestCities(query: string): Promise<CitySuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const data = await apiGet<CitySuggestion[]>(`/locations/suggest?q=${encodeURIComponent(q)}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchLocations(): Promise<LocationCatalog> {
  const data = await apiGet<{
    defaultCity?: string;
    defaultRegion?: string;
    regions?: { id?: string; name?: string; cities?: string[] }[];
  }>('/locations');

  const cities = (data.regions ?? []).flatMap((region) =>
    (region.cities ?? []).map((city) => ({ city, region: region.name ?? '' })),
  );

  return {
    defaultCity: data.defaultCity ?? 'Fortaleza',
    defaultRegion: data.defaultRegion ?? 'Ceará',
    cities,
  };
}
