import type { AdminRole } from '@/lib/auth';

export const PERMISSIONS = {
  viewDashboard: ['superadmin', 'admin', 'consultor'] as AdminRole[],
  viewUsers: ['superadmin', 'admin', 'consultor'] as AdminRole[],
  viewLocations: ['superadmin', 'admin', 'consultor'] as AdminRole[],
  manageEvents: ['superadmin', 'admin'] as AdminRole[],
  manageNotifications: ['superadmin', 'admin'] as AdminRole[],
  managePortalUsers: ['superadmin'] as AdminRole[],
};

export function can(role: AdminRole | undefined, permission: keyof typeof PERMISSIONS): boolean {
  if (!role) return false;
  return PERMISSIONS[permission].includes(role);
}

export function isReadOnly(role: AdminRole | undefined): boolean {
  return role === 'consultor';
}

export function canSeeNavItem(
  role: AdminRole | undefined,
  permission: keyof typeof PERMISSIONS,
  readFor?: keyof typeof PERMISSIONS,
): boolean {
  return can(role, permission) || (readFor ? can(role, readFor) : false);
}
