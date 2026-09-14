import { apiGet } from '@/api/client';

export interface CarouselItem {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  imageUrl: string;
  city: string;
  region: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function fetchCarousels(city: string, region: string): Promise<CarouselItem[]> {
  const params = new URLSearchParams({
    active: 'true',
    city,
    region,
  });
  return apiGet<CarouselItem[]>(`/carousels?${params.toString()}`);
}
