export interface PublicUser {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
  platform?: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface UserStats {
  total: number;
  guests: number;
  registered: number;
  activeToday: number;
}

export interface RegionCatalog {
  id: string;
  name: string;
  cities: string[];
}

export interface LocationsResponse {
  defaultCity: string;
  defaultRegion: string;
  regions: RegionCatalog[];
}

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

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'consultor';
  createdAt: string;
}
