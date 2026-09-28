const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface Place {
  name: string;
  type: string;
  imageUrl?: string;
  address?: string;
  rating: number;
  description: string;
  tags: string[];
  mapsUrl?: string;
  illustrative: boolean;
}

export interface Recommendation {
  title: string;
  subtitle: string;
  places: Place[];
}

export interface CityEvent {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  venue: string;
  startsAt: string;
}

interface PlaceDto {
  nome?: string;
  tipo?: string;
  imagem?: string;
  endereco?: string;
  nota?: number;
  descricao?: string;
  tags?: string[];
  google_maps_uri?: string;
  imagem_ilustrativa?: boolean;
}

interface RecommendationDto {
  titulo?: string;
  subtitulo?: string;
  lugares?: PlaceDto[];
}

function mediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/api/media/')) return `${API_BASE}${url}`;
  return url;
}

function mapPlace(dto: PlaceDto): Place {
  return {
    name: dto.nome ?? '',
    type: dto.tipo ?? '',
    imageUrl: mediaUrl(dto.imagem),
    address: dto.endereco,
    rating: Math.min(5, Math.max(0, Number(dto.nota ?? 0))),
    description: dto.descricao ?? '',
    tags: dto.tags ?? [],
    mapsUrl: dto.google_maps_uri,
    illustrative: dto.imagem_ilustrativa ?? false,
  };
}

function mapRecommendation(dto: RecommendationDto): Recommendation {
  return {
    title: dto.titulo?.trim() || 'Para você hoje',
    subtitle: dto.subtitulo?.trim() || 'Em Fortaleza',
    places: (dto.lugares ?? []).map(mapPlace),
  };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Não foi possível consultar a API.');
  }
  return response.json() as Promise<T>;
}

export async function fetchEvents(): Promise<CityEvent[]> {
  const query = new URLSearchParams({ city: 'Fortaleza', region: 'Ceará', active: 'true' });
  const response = await fetch(`${API_BASE}/events?${query}`);
  if (!response.ok) throw new Error('Não foi possível carregar os eventos.');
  const data = (await response.json()) as CityEvent[];
  return data.map((event) => ({ ...event, imageUrl: mediaUrl(event.imageUrl) }));
}

export async function recommend(input: {
  humor: string;
  sentir: string;
  activities: { id: string; label: string; searchHint: string }[];
}): Promise<Recommendation> {
  const data = await post<RecommendationDto>('/api/recomendar', {
    ...input,
    city: 'Fortaleza',
    region: 'Ceará',
    country: 'Brasil',
  });
  return mapRecommendation(data);
}

export async function searchPlaces(query: string): Promise<Recommendation> {
  const data = await post<RecommendationDto>('/api/buscar', {
    query,
    city: 'Fortaleza',
    region: 'Ceará',
    country: 'Brasil',
  });
  return mapRecommendation(data);
}
