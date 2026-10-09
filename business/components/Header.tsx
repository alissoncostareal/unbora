'use client';

import { useAuth } from '@/lib/auth';
import { useSidebar } from '@/lib/sidebarContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export function Header({ title, subtitle, actionButton }: HeaderProps) {
  const { user } = useAuth();
  const { toggleMobileOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xs">
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Hamburger Button */}
          <button
            onClick={toggleMobileOpen}
            aria-label="Abrir Menu"
            className="lg:hidden w-9 h-9 shrink-0 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-base transition cursor-pointer"
          >
            ☰
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-light text-slate-900 tracking-tight truncate">
                {title}
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-none bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider shrink-0">
                ● Online
              </span>
            </div>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Online Pill on Mobile */}
        <span className="sm:hidden px-2 py-0.5 rounded-none bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold uppercase tracking-wider shrink-0">
          ● Online
        </span>
      </div>

      {actionButton && <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-start sm:self-auto">{actionButton}</div>}
    </header>
  );
}
