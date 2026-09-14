import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export function Panel({
  title,
  children,
  className,
  flush = false,
  action,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  flush?: boolean;
  action?: ReactNode;
}) {
  return (
    <section className={cn('tabela-card mb-6 overflow-hidden', className)}>
      {title ? (
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-[15px] font-semibold text-heading">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className={flush ? undefined : 'px-5 pb-5'}>{children}</div>
    </section>
  );
}
