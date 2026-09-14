import type { NavIconName } from '@/lib/nav-icons';

export type NavPermission =
  | 'viewDashboard'
  | 'viewUsers'
  | 'manageEvents'
  | 'manageNotifications'
  | 'viewLocations'
  | 'managePortalUsers';

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: NavIconName;
  permission: NavPermission;
  readFor?: NavPermission;
  description?: string;
}

export interface NavSection {
  title: string;
  items: DashboardNavItem[];
}

export const DASHBOARD_NAV_SECTIONS: NavSection[] = [
  {
    title: 'Principal',
    items: [
      {
        href: '/',
        label: 'Visão Geral',
        icon: 'dashboard',
        permission: 'viewDashboard',
        description: 'Resumo do app e atalhos rápidos',
      },
      {
        href: '/users',
        label: 'Usuários',
        icon: 'users',
        permission: 'viewUsers',
        description: 'Cadastros e sessões do app mobile',
      },
    ],
  },
  {
    title: 'Conteúdo por local',
    items: [
      {
        href: '/destaques',
        label: 'Destaques',
        icon: 'star',
        permission: 'manageEvents',
        readFor: 'viewUsers',
        description: 'Carousels do app filtrados por cidade e região',
      },
      {
        href: '/notifications',
        label: 'Notificações',
        icon: 'bell',
        permission: 'manageNotifications',
        readFor: 'viewUsers',
        description: 'Avisos push por cidade e região',
      },
    ],
  },
  {
    title: 'Dados',
    items: [
      {
        href: '/locations',
        label: 'Regiões e cidades',
        icon: 'map',
        permission: 'viewLocations',
        description: 'Catálogo de localidades do Ceará',
      },
    ],
  },
  {
    title: 'Administração',
    items: [
      {
        href: '/team',
        label: 'Equipe',
        icon: 'shield',
        permission: 'managePortalUsers',
        description: 'Admins e consultores do portal',
      },
    ],
  },
];

export const DASHBOARD_NAV = DASHBOARD_NAV_SECTIONS.flatMap((section) => section.items);

/** Flat sidebar nav — Tabela-style single list */
export const SIDEBAR_NAV: (DashboardNavItem & { badge?: number })[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: 'dashboard',
    permission: 'viewDashboard',
  },
  {
    href: '/users',
    label: 'Usuários',
    icon: 'users',
    permission: 'viewUsers',
  },
  {
    href: '/destaques',
    label: 'Destaques',
    icon: 'star',
    permission: 'manageEvents',
    readFor: 'viewUsers',
  },
  {
    href: '/notifications',
    label: 'Notificações',
    icon: 'bell',
    permission: 'manageNotifications',
    readFor: 'viewUsers',
  },
  {
    href: '/locations',
    label: 'Regiões',
    icon: 'map',
    permission: 'viewLocations',
  },
  {
    href: '/team',
    label: 'Equipe',
    icon: 'shield',
    permission: 'managePortalUsers',
  },
];

export const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'Usuários',
  '/destaques': 'Destaques',
  '/carousels': 'Destaques',
  '/notifications': 'Notificações',
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
