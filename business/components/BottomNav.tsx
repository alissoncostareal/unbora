'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavItem {
  label: string;
  href: string;
  icon: string;
}

const bottomNavItems: BottomNavItem[] = [
  { label: 'Início', href: '/', icon: '📊' },
  { label: 'Locais', href: '/places', icon: '📍' },
  { label: 'Planos', href: '/plans', icon: '💎' },
  { label: 'Faturas', href: '/invoices', icon: '💳' },
  { label: 'Perks', href: '/perks', icon: '🎁' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0f1115]/95 backdrop-blur-lg border-t border-slate-800/80 flex items-center justify-around py-1.5 px-2 lg:hidden shadow-2xl pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      {bottomNavItems.map((item) => {
        const isActive = pathname === item.href;
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
            <span className="text-base leading-none mb-1">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
