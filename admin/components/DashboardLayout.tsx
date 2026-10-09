'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DashboardHeader } from '@/components/DashboardHeader';
import { NavIcon } from '@/components/NavIcon';
import { getPendingEventsCount } from '@/lib/api';
import { clearAdminSession, getClientSession, ROLE_LABELS, type AdminSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { DASHBOARD_NAV_SECTIONS, isNavItemActive, type DashboardNavItem } from '@/lib/nav';
import { can, canSeeNavItem } from '@/lib/permissions';

function BrandLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="text-[22px] font-normal leading-none tracking-tight text-[#fff8f5]">
        Unbora
      </span>
      <span className="rounded-none bg-[#9a4632]/25 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#ffdad2] uppercase border border-[#9a4632]/40">
        Admin
      </span>
    </Link>
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
      <span className="flex-1 truncate">{label}</span>
      {badge && badge > 0 ? (
        <span
          className={cn(
            'grid size-5 place-items-center rounded-none text-[10px] font-bold',
            isActive ? 'bg-white text-[#9a4632]' : 'bg-white/20 text-white',
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
    <div className="flex min-h-screen bg-[#fbf9f5]">
      {/* Black Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col border-r border-[#26221f] bg-[#141210] max-lg:hidden shadow-xl">
        <div className="flex h-[72px] shrink-0 items-center justify-between px-6 border-b border-[#26221f]">
          <BrandLogo />
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {visibleSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8e857c]">
                {section.title}
              </p>
              <ul className="space-y-1">
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

        {/* Sidebar Footer / User Profile on Dark Theme */}
        <div className="shrink-0 border-t border-[#26221f] p-4 bg-[#0d0c0a]">
          {session ? (
            <div className="mb-3 flex items-center gap-3 rounded-none border border-white/10 bg-white/5 p-2.5">
              <div className="grid size-8 shrink-0 place-items-center rounded-none bg-[#9a4632] text-xs font-semibold text-white shadow-xs">
                {session.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#fff8f5]">{session.name}</p>
                <p className="truncate text-[10px] text-[#8e857c] uppercase tracking-wider">{ROLE_LABELS[session.role]}</p>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-none border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#c9bfb5] transition-all hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Encerrar sessão
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col max-lg:ml-0 lg:ml-[240px]">
        <DashboardHeader pathname={pathname} />

        {/* Mobile Dark Horizontal Navigation */}
        <nav className="flex gap-1.5 overflow-x-auto border-b border-[#26221f] bg-[#141210] px-4 py-2.5 lg:hidden">
          {flatVisible.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);
            const badge = itemBadge(item, pendingEvents);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-none px-3 py-1.5 text-xs font-medium transition-colors border border-transparent',
                  isActive ? 'bg-[#9a4632] text-white font-semibold border-[#9a4632]' : 'text-[#c9bfb5] hover:bg-white/10 hover:text-white',
                )}
              >
                {item.label}
                {badge && badge > 0 ? (
                  <span
                    className={cn(
                      'rounded-none px-1.5 py-0.2 text-[10px] font-bold',
                      isActive ? 'bg-white text-[#9a4632]' : 'bg-white/20 text-white',
                    )}
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-5 py-6 sm:px-8 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
