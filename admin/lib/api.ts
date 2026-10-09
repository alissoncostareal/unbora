import { getClientToken, type AdminLoginResponse, type AdminSession } from '@/lib/auth';
import type {
  CarouselItem,
  CommunityEventItem,
  EventModerationStatus,
  GuideCatalog,
  LocationsResponse,
  CityLimitItem,
  LocationSettingsResponse,
  NotificationItem,
  PlaceBanItem,
  PortalUser,
  PublicUser,
  UserStats,
  CitySuggestion,
  SponsoredPlaceItem,
  SaveSponsoredPlaceInput,
  BillingModel,
  PlanTier,
  PaymentStatus,
  InvoiceStatus,
  PaymentMethod,
  SponsoredInvoiceItem,
  CreateInvoiceInput,
  RechargeCreditsInput,
  SponsoredFinancialOverview,
} from '@/lib/types';

export type {
  GuideBudget,
  GuideCatalog,
  GuideOptionItem,
  PlaceBanItem,
  CarouselItem,
  CommunityEventItem,
  EventModerationStatus,
  LocationsResponse,
  CityLimitItem,
  LocationSettingsResponse,
  NotificationItem,
  PortalUser,
  PublicUser,
  UserStats,
  RegionCatalog,
  CitySuggestion,
  SponsoredPlaceItem,
  SaveSponsoredPlaceInput,
  BillingModel,
  PlanTier,
  PaymentStatus,
  InvoiceStatus,
  PaymentMethod,
  SponsoredInvoiceItem,
  CreateInvoiceInput,
  RechargeCreditsInput,
  SponsoredFinancialOverview,
} from '@/lib/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

function getErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const record = data as Record<string, unknown>;
  if (typeof record.message === 'string') return record.message;
  if (Array.isArray(record.message) && typeof record.message[0] === 'string') {
    return record.message[0];
  }
  return fallback;
}

function resolveToken(token?: string): string | undefined {
  return token ?? getClientToken() ?? undefined;
}

async function fetchJson<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const authToken = resolveToken(token);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getErrorMessage(data, `Erro ao buscar ${path}`));
  }

  return data as T;
}

export function adminLogin(email: string, password: string) {
  return fetchJson<AdminLoginResponse>('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getAdminMe(token?: string) {
  return fetchJson<AdminSession>('/admin/auth/me', undefined, token);
}

export function getUsers(token?: string) {
  return fetchJson<PublicUser[]>('/users', undefined, token);
}

export function getUserStats(token?: string) {
  return fetchJson<UserStats>('/users/stats', undefined, token);
}

export function getHealth() {
  return fetchJson<{ status: string; service: string }>('/health');
}

export function getLocations(token?: string) {
  return fetchJson<LocationsResponse>('/locations', undefined, token);
}

export function getLocationSettings(token?: string) {
  return fetchJson<LocationSettingsResponse>('/admin/locations/settings', undefined, token);
}

export function updateGlobalLocationSettings(defaultMaxResults: number, token?: string) {
  return fetchJson<LocationSettingsResponse>(
    '/admin/locations/settings',
    {
      method: 'PUT',
      body: JSON.stringify({ defaultMaxResults }),
    },
    token,
  );
}

export function saveCityLocationLimit(
  cityName: string,
  maxResults: number,
  active?: boolean,
  token?: string,
) {
  return fetchJson<LocationSettingsResponse>(
    '/admin/locations/settings/cities',
    {
      method: 'POST',
      body: JSON.stringify({ cityName, maxResults, active: active ?? true }),
    },
    token,
  );
}

export function deleteCityLocationLimit(id: string, token?: string) {
  return fetchJson<LocationSettingsResponse>(
    `/admin/locations/settings/cities/${id}`,
    {
      method: 'DELETE',
    },
    token,
  );
}

export function getCarousels(token?: string) {
  return fetchJson<CarouselItem[]>('/carousels', undefined, token);
}

export function createCarousel(
  body: Omit<CarouselItem, 'id' | 'createdAt' | 'updatedAt'>,
  token?: string,
) {
  return fetchJson<CarouselItem>(
    '/carousels',
    { method: 'POST', body: JSON.stringify(body) },
    token,
  );
}

export function deleteCarousel(id: string, token?: string) {
  return fetchJson<{ deleted: true; id: string }>(
    `/carousels/${id}`,
    { method: 'DELETE' },
    token,
  );
}

export function getGuide(token?: string) {
  return fetchJson<GuideCatalog>('/admin/guide', undefined, token);
}

export function createGuideOption(
  body: { step: string; label: string; value?: string; note?: string; line?: string; searchHint?: string },
  token?: string,
) {
  return fetchJson<GuideCatalog>('/admin/guide/options', { method: 'POST', body: JSON.stringify(body) }, token);
}

export function updateGuideOption(
  id: string,
  body: { label?: string; value?: string; note?: string; line?: string; searchHint?: string; active?: boolean },
  token?: string,
) {
  return fetchJson<GuideCatalog>(`/admin/guide/options/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, token);
}

export function deleteGuideOption(id: string, token?: string) {
  return fetchJson<GuideCatalog>(`/admin/guide/options/${id}`, { method: 'DELETE' }, token);
}

export function updateGuideBudget(
  body: { min: number; max: number; step: number; defaultValue: number },
  token?: string,
) {
  return fetchJson<GuideCatalog>('/admin/guide/budget', { method: 'PUT', body: JSON.stringify(body) }, token);
}

export function getPlaceBans(token?: string) {
  return fetchJson<PlaceBanItem[]>('/admin/bans', undefined, token);
}

export function createPlaceBan(
  body: { name: string; placeId?: string; city?: string; reason?: string },
  token?: string,
) {
  return fetchJson<PlaceBanItem>('/admin/bans', { method: 'POST', body: JSON.stringify(body) }, token);
}

export function deletePlaceBan(id: string, token?: string) {
  return fetchJson<{ deleted: true; id: string }>(`/admin/bans/${id}`, { method: 'DELETE' }, token);
}

export function getNotifications(token?: string) {
  return fetchJson<NotificationItem[]>('/notifications', undefined, token);
}

export function createNotification(
  body: {
    title: string;
    body: string;
    city: string;
    region: string;
    active?: boolean;
  },
  token?: string,
) {
  return fetchJson<NotificationItem>(
    '/notifications',
    { method: 'POST', body: JSON.stringify(body) },
    token,
  );
}

export function deleteNotification(id: string, token?: string) {
  return fetchJson<{ deleted: true; id: string }>(
    `/notifications/${id}`,
    { method: 'DELETE' },
    token,
  );
}

export function getPortalUsers(token?: string) {
  return fetchJson<PortalUser[]>('/admin/users', undefined, token);
}

export function createPortalUser(
  body: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'consultor';
  },
  token?: string,
) {
  return fetchJson<PortalUser>(
    '/admin/users',
    { method: 'POST', body: JSON.stringify(body) },
    token,
  );
}

export function getAdminEvents(
  params?: { status?: EventModerationStatus | ''; city?: string; region?: string; category?: string },
  token?: string,
) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.city) query.set('city', params.city);
  if (params?.region) query.set('region', params.region);
  if (params?.category) query.set('category', params.category);
  const qs = query.toString();
  return fetchJson<CommunityEventItem[]>(
    `/admin/events${qs ? `?${qs}` : ''}`,
    undefined,
    token,
  );
}

export function getPendingEventsCount(token?: string) {
  return fetchJson<{ count: number }>('/admin/events/pending-count', undefined, token);
}

export function approveEvent(id: string, token?: string) {
  return fetchJson<CommunityEventItem>(
    `/admin/events/${id}/approve`,
    { method: 'POST', body: '{}' },
    token,
  );
}

export function rejectEvent(id: string, reason?: string, token?: string) {
  return fetchJson<CommunityEventItem>(
    `/admin/events/${id}/reject`,
    { method: 'POST', body: JSON.stringify({ reason: reason ?? '' }) },
    token,
  );
}

export async function suggestCities(query: string, token?: string): Promise<CitySuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const data = await fetchJson<CitySuggestion[]>(`/locations/suggest?q=${encodeURIComponent(q)}`, undefined, token);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function getSponsoredPlaces(token?: string) {
  return fetchJson<SponsoredPlaceItem[]>('/admin/sponsored', undefined, token);
}

export function getSponsoredPlace(id: string, token?: string) {
  return fetchJson<SponsoredPlaceItem>(`/admin/sponsored/${id}`, undefined, token);
}

export function createSponsoredPlace(body: SaveSponsoredPlaceInput, token?: string) {
  return fetchJson<SponsoredPlaceItem>('/admin/sponsored', { method: 'POST', body: JSON.stringify(body) }, token);
}

export function updateSponsoredPlace(id: string, body: Partial<SaveSponsoredPlaceInput>, token?: string) {
  return fetchJson<SponsoredPlaceItem>(`/admin/sponsored/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token);
}

export function toggleSponsoredPlaceActive(id: string, token?: string) {
  return fetchJson<SponsoredPlaceItem>(`/admin/sponsored/${id}/toggle`, { method: 'POST', body: '{}' }, token);
}

export function deleteSponsoredPlace(id: string, token?: string) {
  return fetchJson<{ deleted: true; id: string }>(`/admin/sponsored/${id}`, { method: 'DELETE' }, token);
}

export function getSponsoredFinancialOverview(token?: string) {
  return fetchJson<SponsoredFinancialOverview>('/admin/sponsored/billing/overview', undefined, token);
}

export function getSponsoredInvoices(params?: { placeId?: string; status?: InvoiceStatus }, token?: string) {
  const query = new URLSearchParams();
  if (params?.placeId) query.set('placeId', params.placeId);
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  return fetchJson<SponsoredInvoiceItem[]>(`/admin/sponsored/invoices${qs ? `?${qs}` : ''}`, undefined, token);
}

export function createSponsoredInvoice(placeId: string, body: CreateInvoiceInput, token?: string) {
  return fetchJson<SponsoredInvoiceItem>(`/admin/sponsored/${placeId}/invoices`, { method: 'POST', body: JSON.stringify(body) }, token);
}

export function rechargeSponsoredCredits(placeId: string, body: RechargeCreditsInput, token?: string) {
  return fetchJson<SponsoredInvoiceItem>(`/admin/sponsored/${placeId}/recharge`, { method: 'POST', body: JSON.stringify(body) }, token);
}

export function paySponsoredInvoice(invoiceId: string, token?: string) {
  return fetchJson<SponsoredInvoiceItem>(`/admin/sponsored/invoices/${invoiceId}/pay`, { method: 'POST', body: '{}' }, token);
}

export function cancelSponsoredInvoice(invoiceId: string, token?: string) {
  return fetchJson<SponsoredInvoiceItem>(`/admin/sponsored/invoices/${invoiceId}/cancel`, { method: 'POST', body: '{}' }, token);
}

export { API_BASE_URL };

