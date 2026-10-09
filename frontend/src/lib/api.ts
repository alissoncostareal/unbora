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
  placeId?: string;
  latitude?: number;
  longitude?: number;
  openNow?: boolean | null;
  priceLevel?: string;
  isSponsored?: boolean;
  benefitText?: string;
  sponsoredBadge?: string;
  sponsoredId?: string;
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
  place_id?: string;
  latitude?: number;
  longitude?: number;
  open_now?: boolean | null;
  price_level?: string;
  is_sponsored?: boolean;
  benefit_text?: string;
  sponsored_badge?: string;
  sponsored_id?: string;
}

interface RecommendationDto {
  titulo?: string;
  subtitulo?: string;
  lugares?: PlaceDto[];
}

export async function recordSponsoredClick(id?: string): Promise<void> {
  if (!id) return;
  try {
    await fetch(`${API_BASE}/api/sponsored/${id}/click`, { method: 'POST' });
  } catch (err) {
    console.warn('[Sponsored] Error tracking click:', err);
  }
}

function mediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/api/media/')) return `${API_BASE}${url}`;
  if (url.includes('places.googleapis.com') || url.includes('googleusercontent.com')) {
    return `${API_BASE}/api/media/photo?src=${encodeURIComponent(url)}`;
  }
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
    placeId: dto.place_id,
    latitude: dto.latitude,
    longitude: dto.longitude,
    openNow: dto.open_now,
    priceLevel: dto.price_level,
    isSponsored: dto.is_sponsored,
    benefitText: dto.benefit_text,
    sponsoredBadge: dto.sponsored_badge,
    sponsoredId: dto.sponsored_id,
  };
}

function mapRecommendation(dto: RecommendationDto): Recommendation {
  return {
    title: dto.titulo?.trim() || 'Para você hoje',
    subtitle: dto.subtitulo?.trim() || 'Na sua cidade',
    places: (dto.lugares ?? []).map(mapPlace),
  };
}

async function errorMessage(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const body = JSON.parse(text) as { message?: string };
    if (body.message) return body.message;
  } catch {
    /* resposta não era JSON */
  }
  return text || 'Não foi possível consultar a API.';
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json() as Promise<T>;
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json() as Promise<T>;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  businessName?: string;
  platform?: string;
}

export function loginWithPassword(email: string, password: string): Promise<SessionUser> {
  return post<SessionUser>('/users/login', { email, password });
}

export function registerUser(name: string, email: string, password: string): Promise<SessionUser> {
  return post<SessionUser>('/users/register', { name, email, password, platform: 'web' });
}

export function loginWithGoogle(idToken: string): Promise<SessionUser> {
  return post<SessionUser>('/users/google-login', { idToken, platform: 'web' });
}

export interface CityPlace {
  city: string;
  region: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface LocationCatalog {
  defaultCity: string;
  defaultRegion: string;
  cities: CityPlace[];
}

export interface CitySuggestion {
  city: string;
  region: string;
  country: string;
  label: string;
  latitude?: number | null;
  longitude?: number | null;
}

export async function suggestCities(query: string): Promise<CitySuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const response = await fetch(`${API_BASE}/locations/suggest?q=${encodeURIComponent(q)}`);
  if (!response.ok) return [];
  const data = (await response.json()) as CitySuggestion[];
  return Array.isArray(data) ? data : [];
}

export async function cityFromCoords(latitude: number, longitude: number): Promise<CitySuggestion | null> {
  const response = await fetch(`${API_BASE}/locations/here?lat=${latitude}&lng=${longitude}`);
  if (!response.ok) return null;
  const data = (await response.json()) as CitySuggestion;
  return data.city ? data : null;
}

export async function fetchLocations(): Promise<LocationCatalog> {
  const response = await fetch(`${API_BASE}/locations`);
  if (!response.ok) throw new Error('Não foi possível carregar as cidades.');
  const data = (await response.json()) as {
    defaultCity?: string;
    defaultRegion?: string;
    regions?: { name?: string; cities?: string[] }[];
  };
  const cities = (data.regions ?? []).flatMap((region) =>
    (region.cities ?? []).map((city) => ({ city, region: region.name ?? '' })),
  );
  return {
    defaultCity: data.defaultCity ?? '',
    defaultRegion: data.defaultRegion ?? '',
    cities,
  };
}

export function usableEventImage(event: CityEvent): string | undefined {
  const text = `${event.venue} ${event.title}`;
  if (/shopping|pra[cç]a de alimenta|food court|pra[cç]a de comida/i.test(text)) return undefined;
  if (/^[^\u2014\u2013,-]+[\u2014\u2013-]\s*ce$/i.test(event.venue.trim())) return undefined;
  return event.imageUrl;
}

export async function fetchEvents(city: string): Promise<CityEvent[]> {
  const query = new URLSearchParams({ city, active: 'true' });
  const response = await fetch(`${API_BASE}/events?${query}`);
  if (!response.ok) throw new Error('Não foi possível carregar os eventos.');
  const data = (await response.json()) as CityEvent[];
  return data.map((event) => ({ ...event, imageUrl: mediaUrl(event.imageUrl) }));
}

export async function recommend(input: {
  humor: string;
  sentir: string;
  activities: { id: string; label: string; searchHint: string }[];
  city: string;
  region: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  userId?: string;
}): Promise<Recommendation> {
  const data = await post<RecommendationDto>('/api/recommendations', {
    humor: input.humor,
    sentir: input.sentir,
    activities: input.activities,
    city: input.city,
    region: input.region,
    country: input.country || 'Brasil',
    latitude: input.latitude,
    longitude: input.longitude,
    radiusKm: input.radiusKm,
    userId: input.userId,
  });
  return mapRecommendation(data);
}

export interface CityNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export async function fetchNotifications(city: string, region: string): Promise<CityNotification[]> {
  if (!city.trim()) return [];
  const query = new URLSearchParams({ active: 'true', city, region });
  const response = await fetch(`${API_BASE}/notifications?${query}`);
  if (!response.ok) throw new Error('Não foi possível carregar as notificações.');
  return response.json() as Promise<CityNotification[]>;
}

export function createEvent(input: {
  title: string;
  description: string;
  imageUrl: string;
  venue: string;
  startsAt: string;
  merchantId: string;
  category: string;
  city: string;
  region: string;
}): Promise<CityEvent> {
  return post<CityEvent>('/events', input);
}

export function sendFeedback(input: {
  placeName: string;
  action: 'DISLIKE' | 'SHARE' | 'MAPS_CLICK';
  humor?: string;
  sentir?: string;
  categoryTag?: string;
  placeId?: string;
  userId?: string;
}): Promise<void> {
  return post<void>('/api/recommendations/feedback', input).then(() => undefined);
}

export async function fetchDismissed(userId: string): Promise<string[]> {
  const response = await fetch(`${API_BASE}/api/recommendations/dislikes?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) return [];
  return response.json() as Promise<string[]>;
}

export async function searchPlaces(query: string, scope: CityPlace, userId?: string): Promise<Recommendation> {
  const data = await post<RecommendationDto>('/api/search', {
    query,
    city: scope.city,
    region: scope.region,
    country: scope.country || 'Brasil',
    latitude: scope.latitude,
    longitude: scope.longitude,
    userId,
  });
  return mapRecommendation(data);
}

// --- Merchant & Monetization Portal ---

export interface MerchantPlace {
  id: string;
  name: string;
  city: string;
  region: string;
  country: string;
  type: string;
  description: string;
  benefitText: string;
  categoryTags: string;
  imageUrl: string;
  mapsUrl: string;
  address: string;
  placeId: string;
  rating: number;
  priceLevel: string;
  slotBoost: boolean;
  homeHighlight: boolean;
  active: boolean;
  sortOrder: number;
  impressionsCount: number;
  clicksCount: number;
  billingModel: 'SUBSCRIPTION' | 'CPC_CREDITS' | 'HYBRID' | 'COURTESY';
  planTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'CUSTOM';
  monthlyPrice: number;
  creditBalance: number;
  costPerClick: number;
  costPerImpression: number;
  dailyBudget: number;
  spentToday: number;
  totalSpent: number;
  paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE' | 'TRIAL' | 'EXPIRED' | 'CANCELED';
  currentCycleStart?: string;
  nextBillingDate?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  cnpjCpf?: string;
  billingNotes?: string;
  autoRenew: boolean;
  merchantId?: string;
  merchantName?: string;
  merchantEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MerchantInvoice {
  id: string;
  sponsoredPlaceId: string;
  placeName: string;
  merchantId?: string;
  amount: number;
  dueDate?: string;
  paidAt?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELED';
  paymentMethod: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'MANUAL';
  referencePeriod: string;
  pixCopyPaste?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanTierOption {
  tier: string;
  name: string;
  monthlyPrice: number;
  description: string;
  features: string[];
  slotBoost: boolean;
  homeHighlight: boolean;
}

export function upgradeToMerchant(userId: string, businessName: string, cnpjCpf?: string, phone?: string): Promise<SessionUser> {
  return post<SessionUser>('/users/upgrade-to-merchant', { userId, businessName, cnpjCpf, phone });
}

export function getMerchantPlaces(merchantId: string): Promise<MerchantPlace[]> {
  return get<MerchantPlace[]>(`/merchant/sponsored/places?merchantId=${encodeURIComponent(merchantId)}`);
}

export function createMerchantPlace(merchantId: string, data: Partial<MerchantPlace>): Promise<MerchantPlace> {
  return post<MerchantPlace>(`/merchant/sponsored/places?merchantId=${encodeURIComponent(merchantId)}`, data);
}

export function updateMerchantPlace(merchantId: string, placeId: string, data: Partial<MerchantPlace>): Promise<MerchantPlace> {
  return put<MerchantPlace>(`/merchant/sponsored/places/${encodeURIComponent(placeId)}?merchantId=${encodeURIComponent(merchantId)}`, data);
}

export function toggleMerchantPlaceActive(placeId: string): Promise<MerchantPlace> {
  return post<MerchantPlace>(`/merchant/sponsored/places/${encodeURIComponent(placeId)}/toggle-active`, {});
}

export function rechargeMerchantCredits(placeId: string, amount: number, notes?: string): Promise<MerchantInvoice> {
  return post<MerchantInvoice>(`/merchant/sponsored/places/${encodeURIComponent(placeId)}/recharge`, {
    amount,
    paymentMethod: 'PIX',
    notes,
  });
}

export function changeMerchantPlan(placeId: string, planTier: string, billingModel: string = 'SUBSCRIPTION'): Promise<MerchantInvoice> {
  return post<MerchantInvoice>(`/merchant/sponsored/places/${encodeURIComponent(placeId)}/change-plan`, {
    planTier,
    billingModel,
  });
}

export function getMerchantInvoices(merchantId: string): Promise<MerchantInvoice[]> {
  return get<MerchantInvoice[]>(`/merchant/sponsored/invoices?merchantId=${encodeURIComponent(merchantId)}`);
}

export function getAvailablePlans(): Promise<PlanTierOption[]> {
  return get<PlanTierOption[]>('/merchant/sponsored/plans');
}

