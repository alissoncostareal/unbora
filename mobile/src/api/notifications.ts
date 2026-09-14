import { apiGet } from '@/api/client';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  city: string;
  region: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function fetchNotifications(city: string, region: string): Promise<NotificationItem[]> {
  const params = new URLSearchParams({
    active: 'true',
    city,
    region,
  });
  return apiGet<NotificationItem[]>(`/notifications?${params.toString()}`);
}
