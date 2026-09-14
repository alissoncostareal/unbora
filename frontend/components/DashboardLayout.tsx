'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DashboardHeader } from '@/components/DashboardHeader';
import { NavIcon } from '@/components/NavIcon';
import { clearAdminSession, getClientSession, ROLE_LABELS, type AdminSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { SIDEBAR_NAV, isNavItemActive } from '@/lib/nav';
import { canSeeNavItem } from '@/lib/permissions';

function TabelaLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg className="size-7 shrink-0" viewBox="0 0 28 28" fill="none" aria-hidden>
        <rect x="2" y="2" width="11" height="11" rx="2" fill="#d4ff4d" />
        <rect x="15" y="2" width="11" height="11" rx="2" fill="white" fillOpacity="0.9" />
        <rect x="2" y="15" width="11" height="11" rx="2" fill="white" fillOpacity="0.5" />
        <rect x="15" y="15" width="11" height="11" rx="2" fill="#d4ff4d" fillOpacity="0.6" />
      </svg>
      <span className="text-[17px] font-bold tracking-[0.08em] text-white">UNBORA</span>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon,
  isActive,
  badge,
}: {
  href: string;
  label: string;
  icon: Parameters<typeof NavIcon>[0]['name'];
  isActive: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'tabela-nav-item',
        isActive ? 'tabela-nav-item--active' : 'tabela-nav-item--idle',
      )}
    >
      <NavIcon name={icon} active={isActive} />
      <span className="flex-1">{label}</span>
      {badge && badge > 0 ? (
        <span className="grid size-5 place-items-center rounded-full bg-accent text-[10px] font-bold text-sidebar">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </Link>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [notificationCount] = useState(0);

  useEffect(() => {
    setSession(getClientSession());
  }, []);

  function logout() {
    clearAdminSession();
    router.replace('/login');
  }

  const visibleNav = SIDEBAR_NAV.filter((item) =>
    canSeeNavItem(session?.role, item.permission, item.readFor),
  );

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[220px] flex-col bg-sidebar max-lg:hidden">
        <div className="flex h-[80px] shrink-0 items-center px-5">
          <TabelaLogo />
        </div>

        <nav className="flex-1 overflow-y-auto px-3">
          <ul className="space-y-1">
            {visibleNav.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isNavItemActive(pathname, item.href)}
                  badge={item.href === '/notifications' ? notificationCount : undefined}
                />
              </li>
            ))}
          </ul>
        </nav>

        <div className="shrink-0 px-3 pb-5">
          <button
            type="button"
            onClick={logout}
            className="tabela-nav-item tabela-nav-item--idle mb-3 w-full"
          >
            <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sair
          </button>

          {session ? (
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3">
              <div className="size-10 shrink-0 overflow-hidden rounded-full bg-accent">
                <div className="grid size-full place-items-center text-sm font-bold text-sidebar">
                  {session.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{session.name}</p>
                <p className="truncate text-xs text-sidebar-muted">{ROLE_LABELS[session.role]}</p>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col max-lg:ml-0 lg:ml-[220px]">
        <DashboardHeader pathname={pathname} />

        <nav className="flex gap-1 overflow-x-auto bg-sidebar px-3 py-2 lg:hidden">
          {visibleNav.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium',
                  isActive ? 'bg-accent text-sidebar' : 'text-white/55',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-6 py-2 lg:px-8 lg:py-4">{children}</main>
      </div>
    </div>
  );
}
