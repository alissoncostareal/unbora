import { apiPost } from '@/api/client';
import type { Place, Recommendation, RecommendationRequest } from '@/types';

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
}

interface RecommendationDto {
  titulo?: string;
  subtitulo?: string;
  lugares?: PlaceDto[];
}

export interface RecommendationFeedbackPayload {
  placeName: string;
  action: 'LIKE' | 'DISLIKE' | 'MAPS_CLICK' | 'SHARE';
  humor?: string;
  sentir?: string;
  categoryTag?: string;
  comment?: string;
}

function mapPlace(dto: PlaceDto): Place {
  return {
    name: dto.nome ?? '',
    type: dto.tipo ?? '',
    emoji: dto.icone ?? '',
    imageUrl: dto.imagem,
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
  };
}

function mapRecommendation(dto: RecommendationDto): Recommendation {
  return {
    title: dto.titulo?.trim() || 'Top lugares para você hoje',
    subtitle: dto.subtitulo?.trim() || 'Com base no seu perfil',
    places: (dto.lugares ?? []).map(mapPlace),
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
