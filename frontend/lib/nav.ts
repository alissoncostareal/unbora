import type { NavIconName } from '@/lib/nav-icons';

export type NavPermission =
  | 'viewDashboard'
  | 'viewUsers'
  | 'manageEvents'
  | 'viewLocations'
  | 'managePortalUsers';

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: NavIconName;
  permission: NavPermission;
  readFor?: NavPermission;
  description?: string;
  /** Show pending-events badge when href is /events */
  badgeKey?: 'pendingEvents';
}

export interface NavSection {
  title: string;
  items: DashboardNavItem[];
}

export const DASHBOARD_NAV_SECTIONS: NavSection[] = [
  {
    title: 'Visão',
    items: [
      {
        href: '/',
        label: 'Dashboard',
        icon: 'dashboard',
        permission: 'viewDashboard',
        description: 'Resumo do app e atalhos rápidos',
      },
    ],
  },
  {
    title: 'Conteúdo',
    items: [
      {
        href: '/events',
        label: 'Eventos',
        icon: 'calendar',
        permission: 'manageEvents',
        readFor: 'viewUsers',
        description: 'Moderação e aprovação de eventos da comunidade',
        badgeKey: 'pendingEvents',
      },
      {
        href: '/destaques',
        label: 'Destaques',
        icon: 'star',
        permission: 'manageEvents',
        readFor: 'viewUsers',
        description: 'Carousels do app filtrados por cidade e região',
      },
    ],
  },
  {
    title: 'Pessoas',
    items: [
      {
        href: '/users',
        label: 'Usuários',
        icon: 'users',
        permission: 'viewUsers',
        description: 'Cadastros e sessões do app mobile',
      },
      {
        href: '/team',
        label: 'Equipe',
        icon: 'shield',
        permission: 'managePortalUsers',
        description: 'Admins e consultores do portal',
      },
    ],
  },
  {
    title: 'Local',
    items: [
      {
        href: '/locations',
        label: 'Regiões',
        icon: 'map',
        permission: 'viewLocations',
        description: 'Catálogo de localidades do Ceará',
      },
    ],
  },
];

export const DASHBOARD_NAV = DASHBOARD_NAV_SECTIONS.flatMap((section) => section.items);

/** Flat sidebar nav (same order as sections) */
export const SIDEBAR_NAV: DashboardNavItem[] = DASHBOARD_NAV;

export const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'Usuários',
  '/events': 'Eventos',
  '/destaques': 'Destaques',
  '/carousels': 'Destaques',
  '/locations': 'Regiões e cidades',
  '/team': 'Equipe',
};

export function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const match = Object.entries(PAGE_TITLES)
    .filter(([path]) => path !== '/')
    .sort(([a], [b]) => b.length - a.length)
    .find(([path]) => pathname.startsWith(path));
  return match?.[1] ?? 'Portal';
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
