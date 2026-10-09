export type BillingModel = 'SUBSCRIPTION' | 'CPC_CREDITS' | 'HYBRID' | 'COURTESY';
export type PlanTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'CUSTOM';
export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'TRIAL' | 'EXPIRED' | 'CANCELED';
export type InvoiceStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELED';
export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'MANUAL';

export interface MerchantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  businessName?: string;
  platform?: string;
}

export interface BusinessPlace {
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
  impressionsCount: number;
  clicksCount: number;
  billingModel: BillingModel;
  planTier: PlanTier;
  monthlyPrice: number;
  creditBalance: number;
  costPerClick: number;
  costPerImpression: number;
  dailyBudget: number;
  spentToday: number;
  totalSpent: number;
  paymentStatus: PaymentStatus;
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

export interface BusinessInvoice {
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

export interface PlanTierOption {
  tier: string;
  name: string;
  monthlyPrice: number;
  description: string;
  features: string[];
  slotBoost: boolean;
  homeHighlight: boolean;
}

export interface SavePlaceInput {
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
  dailyBudget?: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  cnpjCpf?: string;
  billingNotes?: string;
  autoRenew?: boolean;
}
