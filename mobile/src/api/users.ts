import { apiPost } from '@/api/client';
import type { AppUser } from '@/types';

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
  platform?: string;
  role?: 'user' | 'merchant';
  businessName?: string;
  createdAt: string;
  lastSeenAt: string;
}

export function syncUser(user: AppUser, platform?: string) {
  return apiPost<BackendUser>('/users/sync', {
    id: user.id,
    name: user.name,
    email: user.email || undefined,
    isGuest: user.isGuest,
    platform,
  });
}

export function registerUser(input: {
  name: string;
  email: string;
  password: string;
  platform?: string;
}) {
  return apiPost<BackendUser>('/users/register', input);
}

export function registerMerchant(input: {
  name: string;
  email: string;
  password: string;
  businessName: string;
  platform?: string;
}) {
  return apiPost<BackendUser>('/users/register-merchant', input);
}

export function loginUser(input: { email: string; password: string }) {
  return apiPost<BackendUser>('/users/login', input);
}

export interface GoogleLoginInput {
  idToken?: string;
  email?: string;
  name?: string;
  googleId?: string;
  platform?: string;
}

export function googleLoginUser(input: GoogleLoginInput) {
  return apiPost<BackendUser>('/users/google-login', input);
}

export function mapBackendUser(user: BackendUser): AppUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isGuest: user.isGuest,
    role: user.role ?? 'user',
    businessName: user.businessName,
  };
}
