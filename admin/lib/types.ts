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
  dailyActive?: number[];
  dailyRegistered?: number[];
  dayLabels?: string[];
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

export interface CityLimitItem {
  id: string;
  cityName: string;
  maxResults: number;
  active: boolean;
  updatedAt?: string;
}

export interface LocationSettingsResponse {
  defaultMaxResults: number;
  cityLimits: CityLimitItem[];
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

export interface GuideOptionItem {
  id: string;
  key: string;
  label: string;
  value?: string | null;
  line?: string | null;
  note?: string | null;
  searchHint?: string | null;
  active: boolean;
  position: number;
}

export interface GuideBudget {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export interface GuideCatalog {
  moods: GuideOptionItem[];
  interests: GuideOptionItem[];
  company: GuideOptionItem[];
  durations: GuideOptionItem[];
  budget: GuideBudget;
}

export interface PlaceBanItem {
  id: string;
  name: string;
  placeId?: string | null;
  city?: string | null;
  reason?: string | null;
  createdAt: string;
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

export type EventModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CommunityEventItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  city: string;
  region: string;
  venue: string;
  startsAt: string;
  active: boolean;
  merchantId: string;
  merchantName?: string | null;
  businessName?: string | null;
  createdAt: string;
  updatedAt: string;
  category: string;
  status: EventModerationStatus;
  rejectionReason?: string | null;
}

