import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

type BadgeVariant = 'guest' | 'registered' | 'active' | 'inactive';

const variants: Record<BadgeVariant, string> = {
  guest: 'bg-warning-light text-warning',
  registered: 'bg-info-light text-info',
  active: 'bg-success-light text-success',
  inactive: 'bg-canvas text-muted',
};

export function Badge({
  children,
  variant,
  className,
}: {
  children: ReactNode;
  variant: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
