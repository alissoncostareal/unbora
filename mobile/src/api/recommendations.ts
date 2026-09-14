import { apiPost, getApiBaseUrl } from '@/api/client';
import type { Place, Recommendation, RecommendationRequest } from '@/types';
import { log, shortUrl } from '@/utils/log';

interface PlaceDto {
  nome?: string;
  tipo?: string;
  icone?: string;
  imagem?: string;
  endereco?: string;
  nota?: number;
  descricao?: string;
  tags?: string[];
  destaque?: boolean;
  google_maps_uri?: string;
  place_id?: string;
  latitude?: number;
  longitude?: number;
  open_now?: boolean;
  user_rating_count?: number;
  imagem_ilustrativa?: boolean;
}

interface RecommendationDto {
  titulo?: string;
  subtitulo?: string;
  lugares?: PlaceDto[];
}

export interface RecommendationFeedbackPayload {
  placeName: string;
  action: 'LIKE' | 'DISLIKE' | 'MAPS_CLICK' | 'SHARE' | 'RATE';
  humor?: string;
  sentir?: string;
  categoryTag?: string;
  comment?: string;
  stars?: number;
  placeId?: string;
}

export function toAppImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  // Absolute HTTPS (ou HTTP local) já apontando pro proxy — usar direto
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('/api/media/')) return url;
    try {
      const host = new URL(url).hostname;
      const proxied =
        host.endsWith('googleusercontent.com') ||
        host === 'images.unsplash.com' ||
        host === 'places.googleapis.com';
      if (!proxied) return url;
      return `${getApiBaseUrl()}/api/media/photo?src=${encodeURIComponent(url)}`;
    } catch {
      return url;
    }
  }
  // Path relativo do proxy: /api/media/p/{id}
  if (url.startsWith('/api/media/')) {
    return `${getApiBaseUrl()}${url}`;
  }
  return url;
}

function mapPlace(dto: PlaceDto): Place {
  return {
    name: dto.nome ?? '',
    type: dto.tipo ?? '',
    emoji: dto.icone ?? '',
    imageUrl: toAppImageUrl(dto.imagem),
    address: dto.endereco,
    rating: Math.min(5, Math.max(0, Number(dto.nota ?? 0))),
    description: dto.descricao ?? '',
    tags: dto.tags ?? [],
    highlighted: dto.destaque ?? false,
    googleMapsUri: dto.google_maps_uri,
    placeId: dto.place_id,
    latitude: dto.latitude,
    longitude: dto.longitude,
    openNow: dto.open_now,
    userRatingCount: dto.user_rating_count,
    imageIllustrative: dto.imagem_ilustrativa ?? false,
  };
}

function mapRecommendation(dto: RecommendationDto): Recommendation {
  const places = (dto.lugares ?? []).map(mapPlace);
  const withImage = places.filter((p) => Boolean(p.imageUrl?.trim())).length;
  const illustrative = places.filter((p) => p.imageIllustrative).length;
  log.info('recommend', 'resultado mapeado', {
    title: dto.titulo,
    total: places.length,
    withImage,
    withoutImage: places.length - withImage,
    illustrative,
    sample: places.slice(0, 3).map((p) => ({
      name: p.name,
      image: shortUrl(p.imageUrl),
    })),
  });
  return {
    title: dto.titulo?.trim() || 'Top lugares para você hoje',
    subtitle: dto.subtitulo?.trim() || 'Com base no seu perfil',
    places,
  };
}

export async function fetchRecommendations(
  request: RecommendationRequest,
): Promise<Recommendation> {
  const data = await apiPost<RecommendationDto>('/api/recomendar', request, 120_000);
  return mapRecommendation(data);
}

export async function searchPlaces(
  query: string,
  city?: string,
  latitude?: number,
  longitude?: number,
): Promise<Recommendation> {
  const data = await apiPost<RecommendationDto>(
    '/api/buscar',
    { query, city, latitude, longitude },
    120_000,
  );
  return mapRecommendation(data);
}

export async function sendRecommendationFeedback(
  feedback: RecommendationFeedbackPayload,
): Promise<void> {
  try {
    await apiPost('/api/recomendar/feedback', feedback, 10_000);
  } catch (err) {
    // Non-blocking telemetry
    console.debug('Failed to send recommendation feedback:', err);
  }
}
