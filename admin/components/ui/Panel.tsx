import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export function Panel({
  title,
  subtitle,
  children,
  className,
  flush = false,
  action,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  flush?: boolean;
  action?: ReactNode;
}) {
  return (
    <section className={cn('tabela-card mb-6 overflow-hidden bg-white border border-[#e8e0d7]', className)}>
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0e9e1] px-6 py-4 bg-[#fbf9f5]/50">
          <div>
            <h2 className="text-[15px] font-semibold text-[#1c1917] tracking-tight">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-[#8a8178]">{subtitle}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={flush ? undefined : 'p-6'}>{children}</div>
    </section>
  );
}
