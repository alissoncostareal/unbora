'use client';

import { getPageTitle } from '@/lib/nav';

function formatDate() {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

export function DashboardHeader({ pathname }: { pathname: string }) {
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e8e0d7] bg-[#fbf9f5]/90 px-5 backdrop-blur-md sm:px-8 lg:h-[72px] lg:px-10">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-[#1c1917] sm:text-xl lg:text-2xl">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-[#e8e0d7] bg-white px-3 py-1 shadow-2xs">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[12px] font-medium text-[#55433e] capitalize">
            {formatDate()}
          </p>
        </div>
      </div>
    </header>
  );
}
