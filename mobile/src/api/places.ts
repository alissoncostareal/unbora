import { apiGet } from '@/api/client';
import { toAppImageUrl } from '@/api/recommendations';

export interface PlaceItem {
  id: string;
  name: string;
  type: string;
  imageUrl?: string;
  imageIllustrative?: boolean;
  address?: string;
  rating: number;
  userRatingCount?: number;
  description: string;
  tags: string[];
  priceLevel?: string;
  googleMapsUri?: string;
  placeId?: string;
  editorialMatch?: string;
  quote?: string;
  city: string;
}

interface PlaceDto {
  nome?: string;
  tipo?: string;
  icone?: string;
  imagem?: string;
  endereco?: string;
  nota?: number;
  descricao?: string;
  tags?: string[];
  google_maps_uri?: string;
  place_id?: string;
  latitude?: number;
  longitude?: number;
  open_now?: boolean;
  user_rating_count?: number;
  price_level?: string;
  imagem_ilustrativa?: boolean;
}

interface RecommendationDto {
  titulo?: string;
  subtitulo?: string;
  lugares?: PlaceDto[];
}

export const curatedAtmospheres: PlaceItem[] = [
  {
    id: 'curated-uritu',
    name: 'Uritu Cafés Especiais',
    type: 'Cafeteria & Confeitaria',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=70',
    address: 'R. Norvinda Pires, 40 - Aldeota, Fortaleza',
    rating: 4.9,
    userRatingCount: 420,
    description: 'Paredes com textura mineral, móveis de madeira curvilínea e uma iluminação pendente dourada que convida à contemplação. Grãos de pequenos produtores da Ibiapaba e Mantiqueira.',
    tags: ['Luz natural filtrada', 'Trilha lo-fi', 'Cafés Especiais'],
    priceLevel: 'R$ R$',
    editorialMatch: '98% Match editorial',
    quote: 'O refúgio definitivo para começar um sábado sem notificações ativas.',
    city: 'Fortaleza',
  },
  {
    id: 'curated-cais-brisa',
    name: 'Bistrô Cais & Brisa',
    type: 'Bistrô & Frutos do Mar',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=70',
    address: 'Av. Beira Mar, 1900 - Praia de Iracema, Fortaleza',
    rating: 4.8,
    userRatingCount: 512,
    description: 'Varanda elevada sobre o calçadão, toalha de linho rústica e cerâmica artesanal. Peixe branco curado no limão-cravo com caju confitado e taças de vinho natural sob as luzes da enseada.',
    tags: ['Vento litorâneo', 'Crepúsculo dourado', 'Vinho Natural'],
    priceLevel: 'R$ R$ R$',
    editorialMatch: '95% Match editorial',
    quote: 'A sensação de estar de férias na sua própria cidade natal.',
    city: 'Fortaleza',
  },
  {
    id: 'curated-garoa',
    name: 'Livraria Garôa & Pátio',
    type: 'Livraria & Café Cultural',
    imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=70',
    address: 'R. Vicente Leite, 680 - Meireles / Aldeota, Fortaleza',
    rating: 4.9,
    userRatingCount: 380,
    description: 'Um pátio protegido com piso de terracota, samambaias exuberantes e acervo de literatura nordestina, poesia e arquitetura. Ideal para esquecer o relógio com uma xícara longa.',
    tags: ['Clima de jardim', 'Poltronas confortáveis', 'Silêncio'],
    priceLevel: 'R$ R$',
    editorialMatch: '99% Match editorial',
    quote: 'Onde as ideias encontram espaço para respirar sem pressa.',
    city: 'Fortaleza',
  },
];

function formatPriceLevel(level?: string): string {
  if (!level) return 'R$ R$';
  if (level === 'PRICE_LEVEL_INEXPENSIVE') return 'R$';
  if (level === 'PRICE_LEVEL_MODERATE') return 'R$ R$';
  if (level === 'PRICE_LEVEL_EXPENSIVE') return 'R$ R$ R$';
  if (level === 'PRICE_LEVEL_VERY_EXPENSIVE') return 'R$ R$ R$ R$';
  return level;
}

export async function fetchPersonalizedPlaces(city: string, region?: string): Promise<{
  title: string;
  subtitle: string;
  items: PlaceItem[];
}> {
  try {
    const qs = new URLSearchParams({ city });
    if (region) qs.set('region', region);
    const data = await apiGet<RecommendationDto>(`/api/recommendations/personalized?${qs.toString()}`, 15_000);

    const items = (data.lugares ?? []).map((dto, index): PlaceItem => {
      const name = dto.nome?.trim() || `Lugar ${index + 1}`;
      const imageUrl = toAppImageUrl(dto.imagem);
      const rating = dto.nota ? Number(dto.nota) : 4.5;
      const type = dto.tipo?.trim() || 'Lugar & Gastronomia';
      const address = dto.endereco?.trim() || city;
      return {
        id: dto.place_id || `place-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        type,
        imageUrl,
        imageIllustrative: dto.imagem_ilustrativa ?? false,
        address,
        rating,
        userRatingCount: dto.user_rating_count,
        description: dto.descricao?.trim() || 'Opção selecionada pela curadoria do Unbora.',
        tags: dto.tags && dto.tags.length > 0 ? dto.tags : ['Curadoria Unbora', type],
        priceLevel: formatPriceLevel(dto.price_level),
        googleMapsUri: dto.google_maps_uri,
        placeId: dto.place_id,
        editorialMatch: `${Math.min(99, Math.max(90, Math.round(rating * 19 + 5)))}% Match editorial`,
        city,
      };
    });

    if (items.length > 0) {
      return {
        title: `Lugares em evidência em ${city}`,
        subtitle: `${items.length} estabelecimentos selecionados`,
        items,
      };
    }
  } catch (err) {
    console.debug('fetchPersonalizedPlaces failed, using curated list:', err);
  }

  // Fallback para curadoria editorial local
  return {
    title: `Lugares em evidência em ${city}`,
    subtitle: 'Edição modelo · Caderno de destinos',
    items: curatedAtmospheres.map((c) => ({ ...c, city })),
  };
}
