import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
}) {
  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <article className="tabela-card p-5 group hover:border-[#dbc1bb] transition-all">
      <div className="mb-3.5 flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8178]">{label}</p>
        <div className="grid size-9 place-items-center rounded-none bg-[#f6f2ec] text-[#55433e] group-hover:bg-[#faf2ee] group-hover:text-[#9a4632] transition-colors border border-[#e8e0d7]">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[28px] font-light leading-none tracking-tight text-[#1c1917]">{value}</p>
        {trend !== undefined ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
              trendPositive
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200',
            )}
          >
            {trendPositive ? '+' : ''}
            {trend.toFixed(0)}%
            {trendLabel ? ` ${trendLabel}` : ''}
          </span>
        ) : null}
      </div>
    </article>
  );
}
