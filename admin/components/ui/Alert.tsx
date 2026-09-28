import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

type AlertVariant = 'error' | 'info';

const variants: Record<AlertVariant, string> = {
  error: 'border-danger/30 bg-danger-light text-danger',
  info: 'border-accent/40 bg-accent-light text-heading',
};

export function Alert({
  children,
  variant = 'error',
  className,
}: {
  children: ReactNode;
  variant?: AlertVariant;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-6 rounded-xl border px-4 py-3.5 text-sm leading-relaxed',
        variants[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
