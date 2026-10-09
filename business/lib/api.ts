import type {
  BusinessInvoice,
  BusinessPlace,
  MerchantUser,
  PlanTierOption,
  SavePlaceInput,
} from './types';

export function getApiBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    return 'https://api.unbora.com.br';
  }
  return 'https://api.unbora.com.br';
}

async function errorMessage(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const body = JSON.parse(text) as { message?: string };
    if (body.message) return body.message;
  } catch {
    /* not json */
  }
  return text || 'Erro ao comunicar com o servidor.';
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(await errorMessage(res));
  }

  return res.json() as Promise<T>;
}

// Auth
export async function loginMerchant(email: string, password: string): Promise<MerchantUser> {
  return request<MerchantUser>('/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function loginWithGoogle(idToken: string): Promise<MerchantUser> {
  return request<MerchantUser>('/users/google-login', {
    method: 'POST',
    body: JSON.stringify({ idToken, platform: 'business_web' }),
  });
}

export async function registerMerchant(
  name: string,
  email: string,
  password: string,
  businessName: string
): Promise<MerchantUser> {
  return request<MerchantUser>('/users/register-merchant', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password,
      businessName,
      platform: 'business_web',
    }),
  });
}

// Places
export async function getPlaces(merchantId: string): Promise<BusinessPlace[]> {
  return request<BusinessPlace[]>(`/merchant/sponsored/places?merchantId=${encodeURIComponent(merchantId)}`, {
    cache: 'no-store',
  });
}

export async function createPlace(merchantId: string, data: SavePlaceInput): Promise<BusinessPlace> {
  return request<BusinessPlace>(`/merchant/sponsored/places?merchantId=${encodeURIComponent(merchantId)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePlace(
  merchantId: string,
  placeId: string,
  data: SavePlaceInput
): Promise<BusinessPlace> {
  return request<BusinessPlace>(
    `/merchant/sponsored/places/${encodeURIComponent(placeId)}?merchantId=${encodeURIComponent(merchantId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
}

export async function togglePlaceActive(placeId: string): Promise<BusinessPlace> {
  return request<BusinessPlace>(`/merchant/sponsored/places/${encodeURIComponent(placeId)}/toggle-active`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// Billing & Plans
export async function rechargeCredits(
  placeId: string,
  amount: number,
  notes?: string
): Promise<BusinessInvoice> {
  return request<BusinessInvoice>(`/merchant/sponsored/places/${encodeURIComponent(placeId)}/recharge`, {
    method: 'POST',
    body: JSON.stringify({ amount, paymentMethod: 'PIX', notes }),
  });
}

export async function changePlan(
  placeId: string,
  planTier: string,
  billingModel: string = 'SUBSCRIPTION'
): Promise<BusinessInvoice> {
  return request<BusinessInvoice>(`/merchant/sponsored/places/${encodeURIComponent(placeId)}/change-plan`, {
    method: 'POST',
    body: JSON.stringify({ planTier, billingModel }),
  });
}

export async function getInvoices(merchantId: string): Promise<BusinessInvoice[]> {
  return request<BusinessInvoice[]>(`/merchant/sponsored/invoices?merchantId=${encodeURIComponent(merchantId)}`, {
    cache: 'no-store',
  });
}

export async function getPlans(): Promise<PlanTierOption[]> {
  return request<PlanTierOption[]>('/merchant/sponsored/plans', {
    cache: 'no-store',
  });
}
