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

export interface CitySuggestion {
  city: string;
  region: string;
  country: string;
  label: string;
  latitude?: number | null;
  longitude?: number | null;
}

export type BillingModel = 'SUBSCRIPTION' | 'CPC_CREDITS' | 'HYBRID' | 'COURTESY';
export type PlanTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'CUSTOM';
export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'TRIAL' | 'EXPIRED' | 'CANCELED';
export type InvoiceStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELED';
export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'BANK_TRANSFER' | 'MANUAL';

export interface SponsoredPlaceItem {
  id: string;
  name: string;
  city: string;
  region?: string;
  country?: string;
  type?: string;
  description?: string;
  benefitText?: string;
  categoryTags?: string;
  imageUrl?: string;
  mapsUrl?: string;
  address?: string;
  placeId?: string;
  rating?: number;
  priceLevel?: string;
  slotBoost?: boolean;
  homeHighlight?: boolean;
  active?: boolean;
  sortOrder?: number;
  impressionsCount?: number;
  clicksCount?: number;
  billingModel?: BillingModel;
  planTier?: PlanTier;
  monthlyPrice?: number;
  creditBalance?: number;
  costPerClick?: number;
  costPerImpression?: number;
  dailyBudget?: number;
  spentToday?: number;
  totalSpent?: number;
  paymentStatus?: PaymentStatus;
  currentCycleStart?: string;
  nextBillingDate?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  cnpjCpf?: string;
  billingNotes?: string;
  autoRenew?: boolean;
  merchantId?: string;
  merchantName?: string;
  merchantEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveSponsoredPlaceInput {
  name: string;
  city: string;
  region?: string;
  country?: string;
  type?: string;
  description?: string;
  benefitText?: string;
  categoryTags?: string;
  imageUrl?: string;
  mapsUrl?: string;
  address?: string;
  placeId?: string;
  rating?: number;
  priceLevel?: string;
  slotBoost?: boolean;
  homeHighlight?: boolean;
  active?: boolean;
  sortOrder?: number;
  billingModel?: BillingModel;
  planTier?: PlanTier;
  monthlyPrice?: number;
  creditBalance?: number;
  costPerClick?: number;
  costPerImpression?: number;
  dailyBudget?: number;
  paymentStatus?: PaymentStatus;
  currentCycleStart?: string;
  nextBillingDate?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  cnpjCpf?: string;
  billingNotes?: string;
  autoRenew?: boolean;
  merchantId?: string;
  merchantName?: string;
  merchantEmail?: string;
}

export interface SponsoredInvoiceItem {
  id: string;
  sponsoredPlaceId: string;
  placeName: string;
  merchantId?: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  referencePeriod?: string;
  pixCopyPaste?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceInput {
  amount: number;
  dueDate?: string;
  paymentMethod?: PaymentMethod;
  referencePeriod?: string;
  notes?: string;
}

export interface RechargeCreditsInput {
  amount: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface SponsoredFinancialOverview {
  monthlyRecurringRevenue: number;
  totalRevenueAllTime: number;
  totalPendingReceivables: number;
  totalOverdueReceivables: number;
  totalWalletBalance: number;
  activeSubscriptionsCount: number;
  activeCpcCampaignsCount: number;
  totalInvoicesCount: number;
  pendingInvoicesCount: number;
  overdueInvoicesCount: number;
  placesByPlanTier: Record<string, number>;
  placesByBillingModel: Record<string, number>;
}


