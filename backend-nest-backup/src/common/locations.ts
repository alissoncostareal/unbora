export interface RegionCatalog {
  id: string;
  name: string;
  cities: string[];
}

export const REGIONS: RegionCatalog[] = [
  {
    id: 'grande-fortaleza',
    name: 'Grande Fortaleza',
    cities: ['Fortaleza', 'Caucaia', 'Maracanaú', 'Eusébio', 'Aquiraz'],
  },
  {
    id: 'litoral-leste',
    name: 'Litoral Leste',
    cities: ['Beberibe', 'Cascavel', 'Aracati', 'Canoa Quebrada'],
  },
  {
    id: 'litoral-oeste',
    name: 'Litoral Oeste',
    cities: ['Cumbuco', 'Paracuru', 'São Gonçalo do Amarante'],
  },
  {
    id: 'serra',
    name: 'Serra de Fortaleza',
    cities: ['Guaramiranga', 'Baturité', 'Redenção'],
  },
  {
    id: 'interior',
    name: 'Interior do Ceará',
    cities: ['Juazeiro do Norte', 'Sobral', 'Crato'],
  },
];

export const DEFAULT_CITY = 'Fortaleza';
export const DEFAULT_REGION = 'Grande Fortaleza';

export function normalizeCity(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  return value.trim();
}

export function normalizeRegion(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  return value.trim();
}

export function matchesLocation(
  item: { city: string; region: string },
  city?: string,
  region?: string,
): boolean {
  const cityMatch = !city || item.city.toLowerCase() === city.toLowerCase();
  const regionMatch = !region || item.region.toLowerCase() === region.toLowerCase();
  return cityMatch && regionMatch;
}
