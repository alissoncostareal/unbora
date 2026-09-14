export type AdminRole = 'superadmin' | 'admin' | 'consultor';

export interface AdminSession {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

export interface AdminLoginResponse {
  token: string;
  user: AdminSession;
}

export const AUTH_COOKIE = 'unbora_admin_token';
export const AUTH_SESSION_KEY = 'unbora_admin_session';

export const ROLE_LABELS: Record<AdminRole, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrador',
  consultor: 'Consultor',
};

export function setAdminSession(data: AdminLoginResponse) {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=${data.token}; path=/; max-age=${60 * 60 * 12}; SameSite=Lax`;
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(data.user));
}

export function clearAdminSession() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  localStorage.removeItem(AUTH_SESSION_KEY);
}

export function getClientSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function getClientToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${AUTH_COOKIE}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}
