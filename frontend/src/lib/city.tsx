import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { cityFromCoords, fetchLocations, type CityPlace } from './api';

const STORAGE_KEY = 'unbora-city';
const RADIUS_KEY = 'unbora-radius';

export function readRadiusKm() {
  const value = Number(localStorage.getItem(RADIUS_KEY));
  return value >= 1 && value <= 30 ? value : 8;
}

export function saveRadiusKm(km: number) {
  localStorage.setItem(RADIUS_KEY, String(km));
}

interface CityContextValue {
  city: string;
  region: string;
  country: string;
  modelCity: boolean;
  latitude?: number;
  longitude?: number;
  cities: CityPlace[];
  locating: boolean;
  locationError: string | null;
  setCity: (place: CityPlace) => void;
  locate: () => Promise<CityPlace | null>;
}

const CityContext = createContext<CityContextValue | null>(null);

const emptyPlace: CityPlace = { city: '', region: '', country: 'Brasil' };
const modelPlace = { city: 'Fortaleza', region: 'Ceará', country: 'Brasil' };

function sameName(left: string, right: string) {
  return left.localeCompare(right, 'pt-BR', { sensitivity: 'base' }) === 0;
}

const BRAZILIAN_STATES = [
  'Mato Grosso do Sul',
  'Rio Grande do Norte',
  'Rio Grande do Sul',
  'Distrito Federal',
  'Espírito Santo',
  'Minas Gerais',
  'Rio de Janeiro',
  'Santa Catarina',
  'São Paulo',
  'Mato Grosso',
  'Amazonas',
  'Rondônia',
  'Roraima',
  'Tocantins',
  'Alagoas',
  'Paraíba',
  'Paraná',
  'Pernambuco',
  'Sergipe',
  'Amapá',
  'Bahia',
  'Ceará',
  'Goiás',
  'Maranhão',
  'Pará',
  'Piauí',
  'Acre',
];

function mentions(text: string, state: string) {
  const escaped = state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}])${escaped}([^\\p{L}]|$)`, 'iu').test(text);
}

export function isBrazilianState(value: string) {
  return BRAZILIAN_STATES.some((state) => sameName(state, value));
}

export function placeArea(city: string, region: string) {
  const name = city.trim();
  const area = region.trim();
  if (!area || (sameName(name, area) && !isBrazilianState(area))) return '';
  return area;
}

export function formatPlace(city: string, region: string) {
  const name = city.trim();
  const area = placeArea(name, region);
  if (!name) return '';
  return area ? `${name}, ${area}` : name;
}

export async function lookupBrazilianState(city: string) {
  const name = city.trim();
  if (!name) return '';
  const response = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`);
  if (!response.ok) return '';
  const data = (await response.json()) as { description?: string; extract?: string; type?: string };
  if (data.type === 'disambiguation') return '';
  const text = `${data.description ?? ''}\n${(data.extract ?? '').slice(0, 280)}`;
  const focus = text.split(/estado/i).slice(1).join(' ') || text;
  return BRAZILIAN_STATES.find((state) => mentions(focus, state)) ?? '';
}

export async function placeFromName(name: string, country = 'Brasil'): Promise<CityPlace> {
  const city = name.trim();
  const region = await lookupBrazilianState(city).catch(() => '');
  return { city, region, country };
}

function readStoredCity(): CityPlace | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CityPlace;
    if (parsed.city) return { ...parsed, region: parsed.region || '', country: parsed.country || 'Brasil' };
  } catch {
    return null;
  }
  return null;
}

function persist(place: CityPlace) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...place, country: place.country || 'Brasil' }));
}

async function placeFromCoords(latitude: number, longitude: number, catalog: CityPlace[]): Promise<CityPlace> {
  const google = await cityFromCoords(latitude, longitude).catch(() => null);
  if (google?.city) {
    const match = catalog.find((place) => sameName(place.city, google.city));
    if (match) return { ...match, country: google.country || 'Brasil' };
    return {
      city: google.city,
      region: google.region || google.city,
      country: google.country || 'Brasil',
    };
  }
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: 'pt',
  });
  const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${query}`);
  if (!response.ok) throw new Error('geocode');
  const data = (await response.json()) as {
    city?: string;
    locality?: string;
    principalSubdivision?: string;
    countryName?: string;
  };
  const names = [data.locality, data.city].filter((name): name is string => Boolean(name));
  const match = catalog.find((place) => names.some((name) => sameName(place.city, name)));
  if (match) return { ...match, country: data.countryName || 'Brasil' };
  const city = names[0] || '';
  return {
    city,
    region: data.principalSubdivision || city,
    country: data.countryName || 'Brasil',
  };
}

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [cities, setCities] = useState<CityPlace[]>([]);
  const [current, setCurrent] = useState<CityPlace>(readStoredCity() ?? emptyPlace);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const citiesRef = useRef<CityPlace[]>([]);
  citiesRef.current = cities;

  const locate = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Este navegador não informa a localização.');
      return null;
    }
    setLocating(true);
    setLocationError(null);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000,
        });
      });
      const located = await placeFromCoords(position.coords.latitude, position.coords.longitude, citiesRef.current);
      const place = {
        ...located,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      persist(place);
      setCurrent(place);
      return place;
    } catch (err) {
      const denied = typeof err === 'object' && err !== null && 'code' in err && err.code === 1;
      setLocationError(denied ? 'A localização ficou bloqueada neste navegador.' : 'Não foi possível ler a localização.');
      return null;
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    if (!current.city || !sameName(current.city, current.region) || isBrazilianState(current.region)) return undefined;
    let cancelled = false;
    lookupBrazilianState(current.city)
      .then((state) => {
        if (cancelled) return;
        const next = { ...current, region: state };
        persist(next);
        setCurrent(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [current]);

  useEffect(() => {
    let cancelled = false;
    fetchLocations()
      .then((catalog) => {
        if (cancelled) return;
        const places = catalog.cities.map((place) => ({ ...place, country: 'Brasil' }));
        citiesRef.current = places;
        setCities(places);
        const stored = readStoredCity();
        if (stored?.city) {
          const match = places.find((place) => sameName(place.city, stored.city));
          setCurrent(match
            ? { ...match, country: stored.country || 'Brasil', latitude: stored.latitude, longitude: stored.longitude }
            : stored);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [locate]);

  const modelCity = !current.city.trim();
  const value = useMemo<CityContextValue>(() => ({
    city: modelCity ? modelPlace.city : current.city,
    region: modelCity ? modelPlace.region : current.region,
    country: current.country || modelPlace.country,
    modelCity,
    latitude: current.latitude,
    longitude: current.longitude,
    cities,
    locating,
    locationError,
    setCity(place) {
      const next = { ...place, country: place.country || 'Brasil' };
      persist(next);
      setCurrent(next);
      setLocationError(null);
    },
    locate,
  }), [cities, current, locate, locating, locationError, modelCity]);

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
  const context = useContext(CityContext);
  if (!context) throw new Error('useCity fora do CityProvider');
  return context;
}
