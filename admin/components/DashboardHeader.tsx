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
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between bg-canvas/90 px-6 backdrop-blur-sm lg:h-[72px] lg:px-8">
      <h1 className="text-xl font-bold tracking-tight text-heading lg:text-2xl">{title}</h1>
      <p className="hidden text-sm capitalize text-muted md:block">{formatDate()}</p>
    </header>
  );
}
