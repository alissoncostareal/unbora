'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavItem {
  label: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactNode;
}

const bottomNavItems: BottomNavItem[] = [
  {
    label: 'Início',
    href: '/',
    icon: ({ className }) => (
      <svg className={className || 'size-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: 'Locais',
    href: '/places',
    icon: ({ className }) => (
      <svg className={className || 'size-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    label: 'Planos',
    href: '/plans',
    icon: ({ className }) => (
      <svg className={className || 'size-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
      </svg>
    ),
  },
  {
    label: 'Faturas',
    href: '/invoices',
    icon: ({ className }) => (
      <svg className={className || 'size-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="0" />
        <line x1="2" x2="22" y1="10" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Perks',
    href: '/perks',
    icon: ({ className }) => (
      <svg className={className || 'size-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0f1115]/95 backdrop-blur-lg border-t border-slate-800/80 flex items-center justify-around py-1.5 px-2 lg:hidden shadow-2xl pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      {bottomNavItems.map((item) => {
        const isActive = pathname === item.href;
        const IconComp = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-none text-[10px] font-semibold uppercase tracking-wider transition-all min-w-[58px] active:scale-95 ${
              isActive
                ? 'text-amber-400 bg-white/10 shadow-xs ring-1 ring-amber-400/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="shrink-0 mb-1">{IconComp({ className: 'size-4' })}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
