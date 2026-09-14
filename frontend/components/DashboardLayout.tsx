'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DashboardHeader } from '@/components/DashboardHeader';
import { NavIcon } from '@/components/NavIcon';
import { UnboraMark } from '@/components/UnboraMark';
import { getPendingEventsCount } from '@/lib/api';
import { clearAdminSession, getClientSession, ROLE_LABELS, type AdminSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { DASHBOARD_NAV_SECTIONS, isNavItemActive, type DashboardNavItem } from '@/lib/nav';
import { can, canSeeNavItem } from '@/lib/permissions';

function BrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <UnboraMark className="size-7 shrink-0" variant="light" />
      <span className="text-[15px] font-bold tracking-[0.14em] text-white">UNBORA</span>
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
        <span
          className={cn(
            'grid size-5 place-items-center rounded-full text-[10px] font-bold',
            isActive ? 'bg-sidebar text-accent' : 'bg-accent text-sidebar',
          )}
        >
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </Link>
  );
}

function itemBadge(item: DashboardNavItem, pendingEvents: number): number | undefined {
  if (item.badgeKey === 'pendingEvents' && pendingEvents > 0) return pendingEvents;
  return undefined;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [pendingEvents, setPendingEvents] = useState(0);

  useEffect(() => {
    setSession(getClientSession());
  }, []);

  useEffect(() => {
    const role = getClientSession()?.role;
    if (!can(role, 'manageEvents') && !can(role, 'viewUsers')) return;
    getPendingEventsCount()
      .then((data) => setPendingEvents(data.count ?? 0))
      .catch(() => setPendingEvents(0));
  }, [pathname]);

  function logout() {
    clearAdminSession();
    router.replace('/login');
  }

  const visibleSections = DASHBOARD_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      canSeeNavItem(session?.role, item.permission, item.readFor),
    ),
  })).filter((section) => section.items.length > 0);

  const flatVisible = visibleSections.flatMap((s) => s.items);

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[220px] flex-col bg-sidebar max-lg:hidden">
        <div className="flex h-[72px] shrink-0 items-center px-5">
          <BrandLogo />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-2">
          {visibleSections.map((section) => (
            <div key={section.title} className="mb-5">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={isNavItemActive(pathname, item.href)}
                      badge={itemBadge(item, pendingEvents)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/5 px-3 pb-5 pt-3">
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
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-sidebar">
                {session.name.charAt(0).toUpperCase()}
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

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-3 py-2 lg:hidden">
          {flatVisible.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);
            const badge = itemBadge(item, pendingEvents);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium',
                  isActive ? 'bg-accent text-sidebar' : 'text-muted hover:text-heading',
                )}
              >
                {item.label}
                {badge && badge > 0 ? (
                  <span
                    className={cn(
                      'rounded-full px-1.5 text-[10px] font-bold',
                      isActive ? 'bg-sidebar/15 text-sidebar' : 'bg-accent text-sidebar',
                    )}
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-6 py-5 lg:px-8 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
