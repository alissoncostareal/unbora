import { apiGet, apiPost } from '@/api/client';
import { toAppImageUrl } from '@/api/recommendations';

export interface EventItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  /** true = capa temática (não é foto oficial do evento) */
  imageIllustrative?: boolean;
  city: string;
  region: string;
  venue: string;
  startsAt: string;
  active: boolean;
  merchantId: string;
  merchantName?: string;
  businessName?: string;
  createdAt: string;
  updatedAt: string;
  whenLabel?: string;
  type?: string;
  category?: string;
  status?: string;
  source?: 'ai' | 'merchant';
}

interface AiEventDto {
  titulo?: string;
  descricao?: string;
  local?: string;
  data?: string;
  tipo?: string;
  imagem?: string;
  imagem_ilustrativa?: boolean;
  imagemIlustrativa?: boolean;
}

interface DiscoverEventsDto {
  titulo?: string;
  subtitulo?: string;
  eventos?: AiEventDto[];
}

function formatStartsAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

/**
 * Resolve capa do evento.
 * - Places em show/Cuca → descarta (quadra)
 * - Unsplash/Picsum com flag ilustrativa → mantém + aviso
 * - Unsplash sem flag → descarta (stock antigo)
 */
export function resolveEventCover(
  url?: string | null,
  opts?: { illustrative?: boolean; title?: string; venue?: string },
): { imageUrl: string; imageIllustrative: boolean } {
  const trimmed = url?.trim() || '';
  if (!trimmed) return { imageUrl: '', imageIllustrative: false };

  const lower = trimmed.toLowerCase();
  const hay = `${opts?.title ?? ''} ${opts?.venue ?? ''}`.toLowerCase();
  const musicMulti =
    /(reggae|show|festival|concerto|musica|música|jazz|samba|forro|forró)/.test(hay) &&
    /(cuca|ginasio|ginásio|quadra|arena|estadio|estádio)/.test(hay);

  if (musicMulti && lower.includes('places.googleapis.com')) {
    return { imageUrl: '', imageIllustrative: false };
  }

  const isStock =
    lower.includes('images.unsplash.com') ||
    lower.includes('picsum.photos') ||
    lower.includes('placehold') ||
    lower.includes('via.placeholder');

  if (isStock) {
    if (opts?.illustrative) {
      return { imageUrl: toAppImageUrl(trimmed) ?? trimmed, imageIllustrative: true };
    }
    return { imageUrl: '', imageIllustrative: false };
  }

  const proxied = toAppImageUrl(trimmed) ?? trimmed;
  return { imageUrl: proxied, imageIllustrative: false };
}

/** @deprecated use resolveEventCover */
export function reliableImageUrl(url?: string | null): string {
  return resolveEventCover(url).imageUrl;
}

export function fetchMerchantEvents(params?: {
  city?: string;
  region?: string;
  category?: string;
}) {
  const query = new URLSearchParams();
  if (params?.city) query.set('city', params.city);
  if (params?.region) query.set('region', params.region);
  if (params?.category) query.set('category', params.category);
  query.set('active', 'true');
  const qs = query.toString();
  return apiGet<EventItem[]>(`/events${qs ? `?${qs}` : ''}`);
}

export async function fetchAiEvents(city: string, region?: string): Promise<{
  title: string;
  subtitle: string;
  items: EventItem[];
}> {
  const data = await apiPost<DiscoverEventsDto>(
    '/api/eventos',
    { city, region },
    120_000,
  );

  const items = (data.eventos ?? []).map((event, index) => {
    const title = event.titulo?.trim() || `Evento ${index + 1}`;
    const venue = event.local?.trim() || city;
    const illustrative = Boolean(event.imagem_ilustrativa ?? event.imagemIlustrativa);
    const cover = resolveEventCover(event.imagem, {
      illustrative,
      title,
      venue,
    });
    return {
      id: `ai-${index}-${title.toLowerCase().replace(/\s+/g, '-')}`,
      title,
      description: event.descricao?.trim() || '',
      imageUrl: cover.imageUrl,
      imageIllustrative: cover.imageIllustrative,
      city,
      region: region || '',
      venue,
      startsAt: new Date().toISOString(),
      whenLabel: event.data?.trim() || '',
      type: event.tipo?.trim() || 'Evento',
      active: true,
      merchantId: 'ai',
      businessName: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'ai' as const,
    };
  });

  return {
    title: data.titulo?.trim() || `Agenda em ${city}`,
    subtitle: data.subtitulo?.trim() || 'Sugestões da IA',
    items,
  };
}

function normalizeKey(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function areSimilarTitles(a: string, b: string): boolean {
  const k1 = normalizeKey(a);
  const k2 = normalizeKey(b);
  if (!k1 || !k2) return false;
  if (k1 === k2) return true;
  if (k1.length >= 8 && k2.length >= 8) {
    if (k1.includes(k2) || k2.includes(k1)) return true;
  }
  const words1 = new Set(k1.match(/.{1,4}/g) || []);
  const words2 = new Set(k2.match(/.{1,4}/g) || []);
  let matches = 0;
  for (const w of words1) {
    if (words2.has(w)) matches++;
  }
  const total = Math.max(words1.size, words2.size);
  return total > 0 && matches / total >= 0.75;
}

function normalizeMerchant(event: EventItem): EventItem {
  const cover = resolveEventCover(event.imageUrl, {
    title: event.title,
    venue: event.venue,
  });
  const category = event.category || event.type || 'Outros';
  return {
    ...event,
    imageUrl: cover.imageUrl,
    imageIllustrative: cover.imageIllustrative,
    source: 'merchant' as const,
    category,
    type: category,
    whenLabel: formatStartsAt(event.startsAt),
    venue: event.venue || event.city,
  };
}

function mergeUnique(primary: EventItem[], secondary: EventItem[]): EventItem[] {
  const seen: string[] = [];
  const out: EventItem[] = [];
  for (const item of [...primary, ...secondary]) {
    const isDup = seen.some((existing) => areSimilarTitles(existing, item.title));
    if (!isDup) {
      seen.push(item.title);
      out.push(item);
    }
  }
  return out;
}

/**
 * Carga rápida da home: só PostgreSQL (/events).
 * Sem Groq, sem Places, sem Brave — tipicamente &lt; 500ms.
 */
export async function fetchHomeEventsFast(
  city: string,
  region?: string,
): Promise<{
  title: string;
  subtitle: string;
  items: EventItem[];
}> {
  const merchantEvents = await fetchMerchantEvents({ city, region });
  const items = mergeUnique(
    (merchantEvents ?? []).map(normalizeMerchant),
    [],
  );

  return {
    title: `Agenda em ${city}`,
    subtitle:
      items.length > 0
        ? `${items.length} eventos em ${city}`
        : 'Atualizando agenda…',
    items,
  };
}

/**
 * Enriquecimento em background: IA (/api/eventos) + merge com o que já está na tela.
 * Não bloqueia o primeiro paint.
 */
export async function fetchHomeEventsAiRefresh(
  city: string,
  region?: string,
  existing: EventItem[] = [],
): Promise<{
  title: string;
  subtitle: string;
  items: EventItem[];
}> {
  try {
    const ai = await fetchAiEvents(city, region);
    const items = mergeUnique(ai.items, existing);
    return {
      title: ai.title || `Agenda em ${city}`,
      subtitle: `${items.length} eventos e atrações em ${city}`,
      items,
    };
  } catch {
    return {
      title: `Agenda em ${city}`,
      subtitle:
        existing.length > 0
          ? `${existing.length} eventos em ${city}`
          : 'Sugestões da IA',
      items: existing,
    };
  }
}

/** @deprecated prefer fetchHomeEventsFast + fetchHomeEventsAiRefresh */
export async function fetchHomeEvents(
  city: string,
  region?: string,
): Promise<{
  title: string;
  subtitle: string;
  items: EventItem[];
}> {
  return fetchHomeEventsFast(city, region);
}

export function createEvent(input: {
  title: string;
  description: string;
  imageUrl: string;
  city: string;
  region: string;
  venue?: string;
  startsAt: string;
  merchantId: string;
  category: string;
}) {
  return apiPost<EventItem>('/events', input);
}
