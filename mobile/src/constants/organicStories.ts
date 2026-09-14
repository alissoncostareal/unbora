import type { CarouselItem } from '@/api/carousels';

/** Stories de curadoria Unbora — utilidade real, não anúncio. */
export interface OrganicStory extends CarouselItem {
  source: 'organic';
  /** Atividades do wizard que priorizam este story */
  activityIds: string[];
  /** Palavras do humor/sentimento que aumentam o rank */
  moodKeywords: string[];
}

export const ORGANIC_STORIES: OrganicStory[] = [
  {
    id: 'organic-cafes-trabalho',
    title: 'Top cafés para trabalhar',
    subtitle: 'Wi-Fi bom, tomadas e clima calmo em Fortaleza',
    tag: 'Dica Unbora',
    imageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    order: 0,
    active: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    source: 'organic',
    activityIds: ['food', 'culture'],
    moodKeywords: ['tranquilo', 'relaxado', 'cansado', 'calma', 'exausto'],
  },
  {
    id: 'organic-eventos-gratis',
    title: 'Eventos gratuitos desta semana',
    subtitle: 'Agenda aberta: shows, feiras e cultura sem pagar entrada',
    tag: 'Comunidade',
    imageUrl:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    order: 1,
    active: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    source: 'organic',
    activityIds: ['live-music', 'culture', 'nightlife'],
    moodKeywords: ['social', 'animado', 'alegria', 'conexão', 'energia'],
  },
  {
    id: 'organic-orla-calma',
    title: 'Orla para desacelerar',
    subtitle: 'Trechos mais tranquilos da Beira-Mar e Iracema ao fim do dia',
    tag: 'Dica Unbora',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    order: 2,
    active: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    source: 'organic',
    activityIds: ['beach', 'outdoors'],
    moodKeywords: ['tranquilo', 'relaxado', 'romântico', 'calma', 'cansado'],
  },
  {
    id: 'organic-noite-leve',
    title: 'Noite leve sem balada',
    subtitle: 'Bares calmos, vinil e conversa — sem fila e sem caos',
    tag: 'Dica Unbora',
    imageUrl:
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    order: 3,
    active: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    source: 'organic',
    activityIds: ['food', 'live-music'],
    moodKeywords: ['social', 'romântico', 'conexão', 'alegria'],
  },
  {
    id: 'organic-parques',
    title: 'Parques e ar livre',
    subtitle: 'Cocó, orla e áreas verdes para caminhar e respirar',
    tag: 'Dica Unbora',
    imageUrl:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    order: 4,
    active: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    source: 'organic',
    activityIds: ['outdoors', 'beach'],
    moodKeywords: ['tranquilo', 'cansado', 'curioso', 'calma', 'energia'],
  },
  {
    id: 'organic-cultura',
    title: 'Agenda cultural de graça',
    subtitle: 'Exposições, cinema e espaços abertos para se inspirar',
    tag: 'Comunidade',
    imageUrl:
      'https://images.unsplash.com/photo-1460661419352-bbfddbf26ce5?w=800&auto=format&fit=crop&q=80',
    city: 'Fortaleza',
    region: 'Grande Fortaleza',
    order: 5,
    active: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    source: 'organic',
    activityIds: ['culture'],
    moodKeywords: ['curioso', 'inspiração', 'romântico', 'realização'],
  },
];

/** Mapa de tags patrocinadas → atividades do wizard (para ranking). */
export const SPONSORED_ACTIVITY_HINTS: Record<string, string[]> = {
  gastronomia: ['food'],
  natureza: ['outdoors', 'beach'],
  evento: ['nightlife', 'live-music', 'culture'],
  destaque: ['food', 'outdoors', 'culture'],
  wellness: ['outdoors'],
};
