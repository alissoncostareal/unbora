export type UnboraDayPeriod = 'morning' | 'afternoon' | 'night';

export interface WizardOption {
  label: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  value: string;
}

export interface ActivityOption extends WizardOption {
  id: string;
  searchHint: string;
}

export interface RecommendationActivity {
  id: string;
  label: string;
  searchHint: string;
}

export interface Place {
  name: string;
  type: string;
  emoji: string;
  imageUrl?: string;
  address?: string;
  rating: number;
  description: string;
  tags: string[];
  highlighted: boolean;
  googleMapsUri?: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
  openNow?: boolean;
  userRatingCount?: number;
}

export interface Recommendation {
  title: string;
  subtitle: string;
  places: Place[];
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
  role?: 'user' | 'merchant';
  businessName?: string;
}

export interface StoredAccount {
  user: AppUser;
  password: string;
}

export interface RecommendationRequest {
  humor: string;
  sentir: string;
  activities: RecommendationActivity[];
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}
