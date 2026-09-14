'use client';

import { getPageTitle } from '@/lib/nav';

function formatDate() {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
}

export function DashboardHeader({ pathname }: { pathname: string }) {
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-[80px] items-center justify-between bg-canvas px-6 lg:px-8">
      <h1 className="text-[26px] font-bold text-heading lg:text-[30px]">{title}</h1>

      <div className="flex items-center gap-5">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium text-muted transition hover:text-heading"
          aria-label="Buscar"
        >
          <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="hidden sm:inline">Buscar</span>
        </button>
        <p className="hidden text-sm font-medium capitalize text-muted md:block">{formatDate()}</p>
      </div>
    </header>
  );
}
