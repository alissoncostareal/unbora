import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

type BadgeVariant =
  | 'guest'
  | 'registered'
  | 'active'
  | 'inactive'
  | 'pending'
  | 'coral'
  | 'neutral';

const variants: Record<BadgeVariant, string> = {
  guest: 'bg-amber-50 text-amber-800 border border-amber-200/80',
  registered: 'bg-blue-50 text-blue-800 border border-blue-200/80',
  active: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
  inactive: 'bg-[#f6f2ec] text-[#746c64] border border-[#e8e0d7]',
  pending: 'bg-amber-50 text-amber-800 border border-amber-200/80',
  coral: 'bg-[#faf2ee] text-[#9a4632] border border-[#ebd8d0]',
  neutral: 'bg-white text-[#55433e] border border-[#e8e0d7]',
};

export function Badge({
  children,
  variant = 'neutral',
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-none px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] uppercase',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
