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
    title: 'Visão Geral',
    items: [
      {
        href: '/',
        label: 'Dashboard',
        icon: 'dashboard',
        permission: 'viewDashboard',
        description: 'Resumo da plataforma e métricas',
      },
    ],
  },
  {
    title: 'Conteúdo & Curadoria',
    items: [
      {
        href: '/guide',
        label: 'Formulário',
        icon: 'form',
        permission: 'manageEvents',
        description: 'Perguntas e etapas que o usuário vê no site',
      },
      {
        href: '/ban-list',
        label: 'Ban List',
        icon: 'ban',
        permission: 'manageEvents',
        description: 'Lugares bloqueados das recomendações e busca',
      },
      {
        href: '/notifications',
        label: 'Notificações',
        icon: 'bell',
        permission: 'manageEvents',
        description: 'Transmissão de avisos para as cidades',
      },
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
        href: '/carousels',
        label: 'Destaques',
        icon: 'star',
        permission: 'manageEvents',
        readFor: 'viewUsers',
        description: 'Carousels do app segmentados por região',
      },
    ],
  },
  {
    title: 'Usuários & Acessos',
    items: [
      {
        href: '/users',
        label: 'Cadastrados',
        icon: 'users',
        permission: 'viewUsers',
        description: 'Usuários cadastrados e métricas de atividade',
      },
      {
        href: '/team',
        label: 'Equipe',
        icon: 'shield',
        permission: 'managePortalUsers',
        description: 'Administradores e consultores do portal',
      },
    ],
  },
  {
    title: 'Localidades',
    items: [
      {
        href: '/locations',
        label: 'Regiões & Cidades',
        icon: 'map',
        permission: 'viewLocations',
        description: 'Catálogo de localidades atendidas',
      },
    ],
  },
];

export const DASHBOARD_NAV = DASHBOARD_NAV_SECTIONS.flatMap((section) => section.items);

/** Flat sidebar nav (same order as sections) */
export const SIDEBAR_NAV: DashboardNavItem[] = DASHBOARD_NAV;

export const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/guide': 'Formulário do Guia',
  '/formulario': 'Formulário do Guia',
  '/ban-list': 'Ban List de Lugares',
  '/lista-negra': 'Ban List de Lugares',
  '/bans': 'Ban List de Lugares',
  '/notifications': 'Notificações & Avisos',
  '/notificacoes': 'Notificações & Avisos',
  '/events': 'Moderação de Eventos',
  '/carousels': 'Destaques do App',
  '/destaques': 'Destaques do App',
  '/users': 'Usuários Cadastrados',
  '/team': 'Equipe do Portal',
  '/locations': 'Regiões e Cidades',
};

export function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const match = Object.entries(PAGE_TITLES)
    .filter(([path]) => path !== '/')
    .sort(([a], [b]) => b.length - a.length)
    .find(([path]) => pathname.startsWith(path));
  return match?.[1] ?? 'Portal Admin';
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
