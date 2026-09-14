import { getClientToken, type AdminLoginResponse, type AdminSession } from '@/lib/auth';
import type {
  CarouselItem,
  CommunityEventItem,
  EventModerationStatus,
  LocationsResponse,
  NotificationItem,
  PortalUser,
  PublicUser,
  UserStats,
} from '@/lib/types';

export type {
  CarouselItem,
  CommunityEventItem,
  EventModerationStatus,
  LocationsResponse,
  NotificationItem,
  PortalUser,
  PublicUser,
  UserStats,
  RegionCatalog,
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

export { API_BASE_URL };
