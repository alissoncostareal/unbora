import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  trend?: number;
}) {
  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <article className="tabela-card p-5">
      <div className="mb-3 flex items-start justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <div className="grid size-8 place-items-center rounded-lg bg-canvas text-muted">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-[26px] font-bold leading-none tracking-tight text-heading">{value}</p>
        {trend !== undefined ? (
          <span
            className={cn(
              'text-xs font-semibold',
              trendPositive ? 'text-success' : 'text-danger',
            )}
          >
            {trendPositive ? '+' : ''}
            {trend.toFixed(2)}%
          </span>
        ) : null}
      </div>
    </article>
  );
}
